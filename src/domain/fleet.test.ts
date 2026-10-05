import { describe, expect, it } from 'vitest';

import { Fleet } from './fleet.js';
import { DEFAULT_CATALOG, RobotCatalog } from './robot-catalog.js';
import { fleetOf } from '../test-support/fleet.js';

describe('Fleet', () => {
  it('reports totals from the catalog', () => {
    const fleet = fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 });

    expect(fleet.totalRobots).toBe(7);
    expect(fleet.totalHours).toBe(2 * 3 + 3 * 5 + 2 * 8);
    expect(fleet.totalCost).toBe(2 * 2 + 3 * 3 + 2 * 4);
  });

  it('treats missing types as zero', () => {
    const fleet = fleetOf({ Delta: 1 });

    expect(fleet.count('Bravo')).toBe(0);
    expect(fleet.entries()).toEqual([
      { type: DEFAULT_CATALOG.find('Bravo'), count: 0 },
      { type: DEFAULT_CATALOG.find('Charlie'), count: 0 },
      { type: DEFAULT_CATALOG.find('Delta'), count: 1 },
    ]);
  });

  it('knows when it is empty', () => {
    expect(Fleet.empty(DEFAULT_CATALOG).isEmpty).toBe(true);
    expect(fleetOf({ Bravo: 1 }).isEmpty).toBe(false);
  });

  it.each([[-1], [1.5], [Number.NaN]])('rejects a count of %s', (count) => {
    const result = Fleet.create(DEFAULT_CATALOG, { Bravo: count });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('INVALID_ROBOT_COUNT');
  });

  it('rejects unknown robot types', () => {
    const result = Fleet.create(DEFAULT_CATALOG, { Echo: 1 });

    expect(!result.ok && result.error.code).toBe('UNKNOWN_ROBOT_TYPE');
  });

  it('adds and subtracts without mutating', () => {
    const base = fleetOf({ Bravo: 2, Delta: 1 });
    const used = fleetOf({ Bravo: 1 });

    expect(base.minus(used).count('Bravo')).toBe(1);
    expect(base.plus(used).count('Bravo')).toBe(3);
    expect(base.count('Bravo')).toBe(2);
  });

  it('refuses to subtract more robots than it has', () => {
    expect(() => fleetOf({ Bravo: 1 }).minus(fleetOf({ Bravo: 2 }))).toThrow(RangeError);
  });

  it('refuses to combine fleets from different catalogs', () => {
    const other = Fleet.empty(RobotCatalog.from(DEFAULT_CATALOG.types));

    expect(() => fleetOf({}).plus(other)).toThrow(TypeError);
  });

  it('lists only the robot types in use', () => {
    expect(
      fleetOf({ Charlie: 1 })
        .inUse()
        .map((entry) => entry.type.name),
    ).toEqual(['Charlie']);
  });
});
