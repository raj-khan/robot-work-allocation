import { describe, expect, it } from 'vitest';

import { DEFAULT_CATALOG, RobotCatalog } from './robot-catalog.js';

describe('RobotCatalog', () => {
  it('ships the three EverBot robot types in display order', () => {
    expect(DEFAULT_CATALOG.types).toEqual([
      { name: 'Bravo', hoursPerDay: 3, costPerDay: 2 },
      { name: 'Charlie', hoursPerDay: 5, costPerDay: 3 },
      { name: 'Delta', hoursPerDay: 8, costPerDay: 4 },
    ]);
  });

  it('looks up a type by name', () => {
    expect(DEFAULT_CATALOG.find('Charlie')?.hoursPerDay).toBe(5);
    expect(DEFAULT_CATALOG.find('Echo')).toBeUndefined();
  });

  it('accepts new robot types without code changes', () => {
    const catalog = RobotCatalog.from([{ name: 'Echo', hoursPerDay: 12, costPerDay: 7 }]);

    expect(catalog.names).toEqual(['Echo']);
  });

  it.each([
    ['an empty list', []],
    ['zero hours', [{ name: 'A', hoursPerDay: 0, costPerDay: 1 }]],
    ['zero cost', [{ name: 'A', hoursPerDay: 1, costPerDay: 0 }]],
    ['fractional hours', [{ name: 'A', hoursPerDay: 1.5, costPerDay: 1 }]],
    ['a blank name', [{ name: ' ', hoursPerDay: 1, costPerDay: 1 }]],
    [
      'duplicate names',
      [
        { name: 'A', hoursPerDay: 1, costPerDay: 1 },
        { name: 'A', hoursPerDay: 2, costPerDay: 2 },
      ],
    ],
  ])('rejects %s', (_label, types) => {
    expect(() => RobotCatalog.from(types)).toThrow();
  });
});
