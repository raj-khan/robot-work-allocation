import type { Allocation } from '../allocation.js';

// Lower rank wins; ranks compare element by element.
export interface Objective {
  readonly name: string;
  rank(allocation: Allocation): readonly number[];
}

export const CHEAPEST: Objective = {
  name: 'cheapest',
  rank: (a) => [a.cost, a.excessHours, a.robots.totalRobots],
};

export const LEAST_EXCESS: Objective = {
  name: 'least-excess',
  rank: (a) => [a.excessHours, a.cost, a.robots.totalRobots],
};

export function compareRanks(a: readonly number[], b: readonly number[]): number {
  for (const [i, value] of a.entries()) {
    const diff = value - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
