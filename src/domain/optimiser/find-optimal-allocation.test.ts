import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { findOptimalAllocation } from './find-optimal-allocation.js';
import { CHEAPEST, LEAST_EXCESS, type Objective } from './objectives.js';
import { bruteForce } from '../../test-support/brute-force.js';
import { fleetOf } from '../../test-support/fleet.js';
import { Fleet } from '../fleet.js';
import { RobotCatalog } from '../robot-catalog.js';

const countsArb = fc.record({
  Bravo: fc.integer({ min: 0, max: 5 }),
  Charlie: fc.integer({ min: 0, max: 5 }),
  Delta: fc.integer({ min: 0, max: 5 }),
});

describe('findOptimalAllocation', () => {
  it('returns undefined when capacity is too low', () => {
    expect(findOptimalAllocation(fleetOf({ Bravo: 1 }), 4, CHEAPEST)).toBeUndefined();
  });

  it('returns an empty allocation for zero hours', () => {
    const allocation = findOptimalAllocation(fleetOf({ Bravo: 1 }), 0, CHEAPEST);

    expect(allocation?.robots.isEmpty).toBe(true);
  });

  it('picks the cheapest mix', () => {
    const allocation = findOptimalAllocation(
      fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }),
      20,
      CHEAPEST,
    );

    expect(allocation?.robots.inUse().map(({ type, count }) => [type.name, count])).toEqual([
      ['Charlie', 1],
      ['Delta', 2],
    ]);
  });

  it('works with any catalog, not just the default three', () => {
    const catalog = RobotCatalog.from([
      { name: 'Bravo', hoursPerDay: 3, costPerDay: 2 },
      { name: 'Echo', hoursPerDay: 12, costPerDay: 5 },
    ]);
    const fleet = Fleet.create(catalog, { Bravo: 4, Echo: 1 });
    if (!fleet.ok) throw fleet.error;

    expect(findOptimalAllocation(fleet.value, 12, CHEAPEST)?.robots.count('Echo')).toBe(1);
  });

  it.each<[string, Objective]>([
    ['CHEAPEST', CHEAPEST],
    ['LEAST_EXCESS', LEAST_EXCESS],
  ])('matches brute force for %s', (_name, objective) => {
    fc.assert(
      fc.property(countsArb, fc.integer({ min: 0, max: 80 }), (counts, hours) => {
        const fleet = fleetOf(counts);
        const expected = bruteForce(fleet, hours, objective);
        const actual = findOptimalAllocation(fleet, hours, objective);

        expect(actual && objective.rank(actual)).toEqual(expected && objective.rank(expected));
      }),
      { numRuns: 300 },
    );
  });

  it('never uses more robots than available', () => {
    fc.assert(
      fc.property(countsArb, fc.integer({ min: 1, max: 80 }), (counts, hours) => {
        const fleet = fleetOf(counts);
        const allocation = findOptimalAllocation(fleet, hours, CHEAPEST);
        if (!allocation) return;

        expect(() => fleet.minus(allocation.robots)).not.toThrow();
        expect(allocation.providedHours).toBeGreaterThanOrEqual(hours);
      }),
    );
  });

  it('stays fast on large requests', () => {
    const start = performance.now();
    findOptimalAllocation(
      fleetOf({ Bravo: 50_000, Charlie: 50_000, Delta: 50_000 }),
      100_000,
      CHEAPEST,
    );

    expect(performance.now() - start).toBeLessThan(2_000);
  });
});
