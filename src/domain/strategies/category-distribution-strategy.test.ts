import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { CategoryDistributionStrategy } from './category-distribution-strategy.js';
import { fleetOf } from '../../test-support/fleet.js';
import type { Allocation } from '../allocation.js';

const strategy = new CategoryDistributionStrategy();
const specFleet = fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 });

const counts = (allocation: Allocation): Record<string, number> =>
  Object.fromEntries(allocation.robots.entries().map(({ type, count }) => [type.name, count]));

const allocate = (hours: number): Allocation => {
  const result = strategy.allocate(specFleet, hours);
  if (!result.ok) throw result.error;
  return result.value;
};

describe('CategoryDistributionStrategy (Level 1)', () => {
  it('assigns one of each type for 16 hours (spec example)', () => {
    const allocation = allocate(16);

    expect(counts(allocation)).toEqual({ Bravo: 1, Charlie: 1, Delta: 1 });
    expect(allocation.providedHours).toBe(16);
  });

  it.each([
    [17, 'Bravo'],
    [21, 'Charlie'],
    [24, 'Delta'],
  ])('adds the robot with least excess for %i hours (spec example)', (hours, extra) => {
    expect(allocate(hours).robots.count(extra)).toBe(2);
  });

  it('prefers the cheaper mix when excess ties', () => {
    // 24h: Delta (8h, $4) and Charlie + Bravo (8h, $5) both leave no excess.
    expect(allocate(24).cost).toBe(13);
  });

  it('costs $12 for 20 hours, matching the Level 1 vs 2 comparison', () => {
    expect(allocate(20).cost).toBe(12);
  });

  it('still uses every type for tiny requests', () => {
    const allocation = allocate(1);

    expect(counts(allocation)).toEqual({ Bravo: 1, Charlie: 1, Delta: 1 });
    expect(allocation.excessHours).toBe(15);
  });

  it('fails when a category has no robots', () => {
    const result = strategy.allocate(fleetOf({ Bravo: 2, Delta: 2 }), 10);

    expect(!result.ok && result.error.code).toBe('CATEGORY_DISTRIBUTION_IMPOSSIBLE');
  });

  it('fails when there are no robots at all', () => {
    const result = strategy.allocate(fleetOf({}), 10);

    expect(!result.ok && result.error.code).toBe('NO_ROBOTS');
  });

  it('fails when capacity is too low', () => {
    const result = strategy.allocate(specFleet, 38);

    expect(!result.ok && result.error.code).toBe('INSUFFICIENT_CAPACITY');
  });

  it('rejects invalid hours', () => {
    const result = strategy.allocate(specFleet, 0);

    expect(!result.ok && result.error.code).toBe('INVALID_WORK_HOURS');
  });

  it('always covers the request with every type present', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 37 }), (hours) => {
        const allocation = allocate(hours);

        expect(allocation.providedHours).toBeGreaterThanOrEqual(hours);
        expect(allocation.robots.inUse()).toHaveLength(3);
      }),
    );
  });
});
