import { describe, expect, it } from 'vitest';

import { Allocation } from './allocation.js';
import { fleetOf } from '../test-support/fleet.js';

describe('Allocation', () => {
  it('derives hours, cost and excess from its robots', () => {
    const allocation = Allocation.of(fleetOf({ Charlie: 1, Delta: 2 }), 20);

    expect(allocation.providedHours).toBe(21);
    expect(allocation.cost).toBe(11);
    expect(allocation.excessHours).toBe(1);
    expect(allocation.requestedHours).toBe(20);
  });

  it('refuses robots that do not cover the request', () => {
    expect(() => Allocation.of(fleetOf({ Bravo: 1 }), 4)).toThrow(RangeError);
  });
});
