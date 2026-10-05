import { describe, expect, it } from 'vitest';

import { Warehouse } from './warehouse.js';
import { fleetOf } from '../../test-support/fleet.js';
import { DEFAULT_CATALOG } from '../robot-catalog.js';

describe('Warehouse', () => {
  it('offers enough of every type to cover any shortfall when unlimited', () => {
    const stock = Warehouse.unlimited(DEFAULT_CATALOG).stockFor(10);

    expect(stock.count('Bravo') * 3).toBeGreaterThanOrEqual(10);
    expect(stock.count('Delta') * 8).toBeGreaterThanOrEqual(10);
  });

  it('stays unlimited after robots are taken', () => {
    const warehouse = Warehouse.unlimited(DEFAULT_CATALOG);

    expect(warehouse.take(fleetOf({ Delta: 3 }))).toBe(warehouse);
    expect(warehouse.isUnlimited).toBe(true);
  });

  it('offers only its stock when finite', () => {
    const warehouse = Warehouse.of(fleetOf({ Bravo: 2 }));

    expect(warehouse.stockFor(100).count('Bravo')).toBe(2);
    expect(warehouse.stockFor(100).count('Delta')).toBe(0);
    expect(warehouse.isUnlimited).toBe(false);
  });

  it('shrinks when robots are taken from finite stock', () => {
    const warehouse = Warehouse.of(fleetOf({ Bravo: 2 })).take(fleetOf({ Bravo: 1 }));

    expect(warehouse.stockFor(1).count('Bravo')).toBe(1);
  });
});
