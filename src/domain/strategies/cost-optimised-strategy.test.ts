import { describe, expect, it } from 'vitest';

import { CostOptimisedStrategy } from './cost-optimised-strategy.js';
import { fleetOf } from '../../test-support/fleet.js';
import type { Fleet } from '../fleet.js';

const strategy = new CostOptimisedStrategy();

const inUse = (fleet: Fleet, hours: number): [string, number][] => {
  const result = strategy.allocate(fleet, hours);
  if (!result.ok) throw result.error;
  return result.value.robots.inUse().map(({ type, count }) => [type.name, count]);
};

describe('CostOptimisedStrategy (Level 2)', () => {
  it('picks Charlie 1 + Delta 2 for 20 hours at $11 (spec example 1)', () => {
    const result = strategy.allocate(fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }), 20);

    expect(result.ok && result.value.providedHours).toBe(21);
    expect(result.ok && result.value.cost).toBe(11);
    expect(inUse(fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }), 20)).toEqual([
      ['Charlie', 1],
      ['Delta', 2],
    ]);
  });

  it('picks Bravo 2 for 6 hours at $4 (spec example 2)', () => {
    // Delta 1 also costs $4, but Bravo 2 has no excess hours.
    expect(inUse(fleetOf({ Bravo: 2, Charlie: 2, Delta: 3 }), 6)).toEqual([['Bravo', 2]]);
  });

  it('is free to use a single robot type', () => {
    expect(inUse(fleetOf({ Bravo: 5, Charlie: 5, Delta: 5 }), 16)).toEqual([['Delta', 2]]);
  });

  it('fails when there are no robots', () => {
    const result = strategy.allocate(fleetOf({}), 5);

    expect(!result.ok && result.error.code).toBe('NO_ROBOTS');
  });

  it('fails when capacity is too low', () => {
    const result = strategy.allocate(fleetOf({ Delta: 1 }), 9);

    expect(!result.ok && result.error.code).toBe('INSUFFICIENT_CAPACITY');
  });

  it('rejects invalid hours', () => {
    const result = strategy.allocate(fleetOf({ Delta: 1 }), -1);

    expect(!result.ok && result.error.code).toBe('INVALID_WORK_HOURS');
  });
});
