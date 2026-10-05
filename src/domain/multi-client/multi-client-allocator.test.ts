import { describe, expect, it } from 'vitest';

import { MultiClientAllocator } from './multi-client-allocator.js';
import { fleetOf } from '../../test-support/fleet.js';
import { DEFAULT_CATALOG } from '../robot-catalog.js';
import { Warehouse } from '../standby/warehouse.js';

const allocator = new MultiClientAllocator();
const unlimited = Warehouse.unlimited(DEFAULT_CATALOG);

describe('MultiClientAllocator (Level 4)', () => {
  it('serves clients from highest to lowest hours, keeping input order on ties', () => {
    const run = allocator.allocate([12, 16, 17, 10, 16], fleetOf({ Delta: 20 }), unlimited);

    expect(run.outcomes.map((o) => [o.client.id, o.client.hours])).toEqual([
      [3, 17],
      [2, 16],
      [5, 16],
      [1, 12],
      [4, 10],
    ]);
  });

  it('shares one active pool across clients', () => {
    const run = allocator.allocate([8, 8], fleetOf({ Delta: 1 }), unlimited);
    const [first, second] = run.outcomes;

    expect(first?.result.ok && first.result.value.needsStandby).toBe(false);
    expect(second?.result.ok && second.result.value.activeCapacity).toBe(0);
    expect(second?.result.ok && second.result.value.standbyRobots.count('Delta')).toBe(1);
    expect(run.remainingActive.isEmpty).toBe(true);
  });

  it('lists standby robots once the active pool runs out', () => {
    const run = allocator.allocate(
      [12, 16, 17, 10, 21],
      fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }),
      unlimited,
    );

    const standbyCost = run.outcomes.reduce(
      (sum, o) => sum + (o.result.ok ? o.result.value.standbyRobots.totalCost : 0),
      0,
    );
    expect(run.outcomes.every((o) => o.result.ok)).toBe(true);
    expect(standbyCost).toBeGreaterThan(0);
  });

  it('consumes a finite warehouse and reports clients it cannot serve', () => {
    const warehouse = Warehouse.of(fleetOf({ Delta: 1 }));
    const run = allocator.allocate([8, 8], fleetOf({}), warehouse);
    const [first, second] = run.outcomes;

    expect(first?.result.ok).toBe(true);
    expect(!second!.result.ok && second!.result.error.code).toBe('NO_ROBOTS');
  });

  it('keeps going after one client fails', () => {
    const run = allocator.allocate([30, 5], fleetOf({ Charlie: 1 }), Warehouse.of(fleetOf({})));

    expect(run.outcomes.map((o) => o.result.ok)).toEqual([false, true]);
  });
});
