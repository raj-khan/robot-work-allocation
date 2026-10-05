import { describe, expect, it } from 'vitest';

import { StandbyActivation } from './standby-activation.js';
import { Warehouse } from './warehouse.js';
import { unwrap } from '../../shared/result.js';
import { fleetOf } from '../../test-support/fleet.js';
import { DEFAULT_CATALOG } from '../robot-catalog.js';
import { CategoryDistributionStrategy } from '../strategies/category-distribution-strategy.js';

const activation = new StandbyActivation();
const unlimited = Warehouse.unlimited(DEFAULT_CATALOG);
const names = (fleet: { inUse(): { type: { name: string }; count: number }[] }) =>
  fleet.inUse().map(({ type, count }) => [type.name, count]);

describe('StandbyActivation (Level 3)', () => {
  it('activates one Charlie for 21h against 16h of capacity (spec example)', () => {
    const plan = unwrap(
      activation.plan(fleetOf({ Bravo: 1, Charlie: 1, Delta: 1 }), 21, unlimited),
    );

    expect(plan.activeCapacity).toBe(16);
    expect(plan.needsStandby).toBe(true);
    expect(names(plan.standbyRobots)).toEqual([['Charlie', 1]]);
    expect(plan.standbyRobots.totalCost).toBe(3);
    expect(names(plan.activeRobots)).toEqual([
      ['Bravo', 1],
      ['Charlie', 1],
      ['Delta', 1],
    ]);
    expect(plan.providedHours).toBe(21);
    expect(plan.totalCost).toBe(12);
  });

  it('uses the cheapest active robots when capacity is enough', () => {
    const plan = unwrap(
      activation.plan(fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }), 20, unlimited),
    );

    expect(plan.needsStandby).toBe(false);
    expect(plan.standbyRobots.isEmpty).toBe(true);
    expect(plan.totalCost).toBe(11);
  });

  it('covers everything from standby when nothing is active', () => {
    const plan = unwrap(activation.plan(fleetOf({}), 8, unlimited));

    expect(names(plan.standbyRobots)).toEqual([['Delta', 1]]);
  });

  it('respects a finite warehouse', () => {
    const warehouse = Warehouse.of(fleetOf({ Bravo: 5 }));
    const plan = unwrap(activation.plan(fleetOf({ Delta: 1 }), 13, warehouse));

    expect(names(plan.standbyRobots)).toEqual([['Bravo', 2]]);
  });

  it('fails when the warehouse cannot cover the shortfall', () => {
    const result = activation.plan(fleetOf({ Delta: 1 }), 30, Warehouse.of(fleetOf({ Bravo: 1 })));

    expect(!result.ok && result.error.code).toBe('INSUFFICIENT_CAPACITY');
  });

  it('fails when there are no robots anywhere', () => {
    const result = activation.plan(fleetOf({}), 5, Warehouse.of(fleetOf({})));

    expect(!result.ok && result.error.code).toBe('NO_ROBOTS');
  });

  it('rejects invalid hours', () => {
    const result = activation.plan(fleetOf({ Delta: 1 }), 2.5, unlimited);

    expect(!result.ok && result.error.code).toBe('INVALID_WORK_HOURS');
  });
});

describe('StandbyActivation with an injected strategy', () => {
  it('passes on failures from the strategy it was given', () => {
    const strict = new StandbyActivation(new CategoryDistributionStrategy());

    const result = strict.plan(fleetOf({ Delta: 2 }), 8, unlimited);

    expect(!result.ok && result.error.code).toBe('CATEGORY_DISTRIBUTION_IMPOSSIBLE');
  });
});
