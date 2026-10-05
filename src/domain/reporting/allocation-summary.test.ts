import { describe, expect, it } from 'vitest';

import { summarise } from './allocation-summary.js';
import { fleetOf } from '../../test-support/fleet.js';
import { MultiClientAllocator } from '../multi-client/multi-client-allocator.js';
import { DEFAULT_CATALOG } from '../robot-catalog.js';
import { Warehouse } from '../standby/warehouse.js';

const allocator = new MultiClientAllocator();
const unlimited = Warehouse.unlimited(DEFAULT_CATALOG);

describe('summarise', () => {
  it('totals robots, cost and hours across served clients', () => {
    // 16h takes both Deltas, 10h then needs standby: Charlie 2 ($6, 10h).
    const run = allocator.allocate([10, 16], fleetOf({ Delta: 2 }), unlimited);

    const summary = summarise(run);

    expect(summary.clientsServed).toBe(2);
    expect(summary.clientsFailed).toBe(0);
    expect(summary.totalRobotsUsed).toBe(4);
    expect(summary.standbyRobotsActivated).toBe(2);
    expect(summary.totalChargingCost).toBe(14);
    expect(summary.hoursRequested).toBe(26);
    expect(summary.hoursProvided).toBe(26);
    expect(summary.averageUtilisation).toBe(1);
  });

  it('reports per type use of the active fleet', () => {
    const run = allocator.allocate([16], fleetOf({ Bravo: 2, Charlie: 2, Delta: 2 }), unlimited);

    expect(summarise(run).byType).toEqual([
      { name: 'Bravo', activeAvailable: 2, activeUsed: 0, standbyActivated: 0, utilisation: 0 },
      { name: 'Charlie', activeAvailable: 2, activeUsed: 0, standbyActivated: 0, utilisation: 0 },
      { name: 'Delta', activeAvailable: 2, activeUsed: 2, standbyActivated: 0, utilisation: 1 },
    ]);
  });

  it('measures utilisation as requested over provided hours', () => {
    const run = allocator.allocate([7], fleetOf({ Delta: 1 }), unlimited);

    expect(summarise(run).averageUtilisation).toBeCloseTo(7 / 8);
  });

  it('leaves utilisation undefined when nothing was available or provided', () => {
    const run = allocator.allocate([5], fleetOf({}), Warehouse.of(fleetOf({})));
    const summary = summarise(run);

    expect(summary.clientsFailed).toBe(1);
    expect(summary.averageUtilisation).toBeUndefined();
    expect(summary.byType[0]?.utilisation).toBeUndefined();
  });
});
