import type { Allocation } from './allocation.js';

export interface StrategyComparison {
  readonly baselineCost: number;
  readonly optimisedCost: number;
  readonly costDifference: number;
}

// Shows what the Level 1 category rule costs over the cheapest option.
export function compareStrategies(baseline: Allocation, optimised: Allocation): StrategyComparison {
  return {
    baselineCost: baseline.cost,
    optimisedCost: optimised.cost,
    costDifference: baseline.cost - optimised.cost,
  };
}
