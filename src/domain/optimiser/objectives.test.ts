import { describe, expect, it } from 'vitest';

import { compareRanks, CHEAPEST, LEAST_EXCESS } from './objectives.js';
import { Allocation } from '../allocation.js';
import { fleetOf } from '../../test-support/fleet.js';

describe('objectives', () => {
  const twoBravo = Allocation.of(fleetOf({ Bravo: 2 }), 6);
  const oneDelta = Allocation.of(fleetOf({ Delta: 1 }), 6);

  it('CHEAPEST ranks by cost, then excess, then robot count', () => {
    expect(CHEAPEST.rank(twoBravo)).toEqual([4, 0, 2]);
    expect(CHEAPEST.rank(oneDelta)).toEqual([4, 2, 1]);
  });

  it('LEAST_EXCESS ranks by excess, then cost, then robot count', () => {
    expect(LEAST_EXCESS.rank(oneDelta)).toEqual([2, 4, 1]);
  });

  it('compares ranks lexicographically', () => {
    expect(compareRanks([1, 9], [2, 0])).toBeLessThan(0);
    expect(compareRanks([2, 1], [2, 0])).toBeGreaterThan(0);
    expect(compareRanks([2, 0], [2, 0])).toBe(0);
  });
});
