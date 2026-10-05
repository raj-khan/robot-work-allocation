import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { CategoryDistributionStrategy } from './strategies/category-distribution-strategy.js';
import { CostOptimisedStrategy } from './strategies/cost-optimised-strategy.js';
import { compareStrategies } from './strategy-comparison.js';
import { unwrap } from '../shared/result.js';
import { fleetOf } from '../test-support/fleet.js';

const level1 = new CategoryDistributionStrategy();
const level2 = new CostOptimisedStrategy();

describe('compareStrategies', () => {
  it('reports a $1 difference for the spec example', () => {
    const fleet = fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 });

    const comparison = compareStrategies(
      unwrap(level1.allocate(fleet, 20)),
      unwrap(level2.allocate(fleet, 20)),
    );

    expect(comparison).toEqual({ baselineCost: 12, optimisedCost: 11, costDifference: 1 });
  });

  it('never finds Level 2 more expensive than Level 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 60 }),
        (bravo, charlie, delta, hours) => {
          const fleet = fleetOf({ Bravo: bravo, Charlie: charlie, Delta: delta });
          const baseline = level1.allocate(fleet, hours);
          const optimised = level2.allocate(fleet, hours);
          if (!baseline.ok || !optimised.ok) return;

          expect(
            compareStrategies(baseline.value, optimised.value).costDifference,
          ).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});
