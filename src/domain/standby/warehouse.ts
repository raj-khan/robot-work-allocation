import { unwrap } from '../../shared/result.js';
import { Fleet } from '../fleet.js';
import type { RobotCatalog } from '../robot-catalog.js';

// Standby robots kept off the active roster. Unlimited unless stock is given.
export class Warehouse {
  private constructor(
    private readonly catalog: RobotCatalog,
    private readonly stock: Fleet | undefined,
  ) {}

  static unlimited(catalog: RobotCatalog): Warehouse {
    return new Warehouse(catalog, undefined);
  }

  static of(stock: Fleet): Warehouse {
    return new Warehouse(stock.catalog, stock);
  }

  get isUnlimited(): boolean {
    return this.stock === undefined;
  }

  // Robots on offer for a shortfall; unlimited stock offers just enough of each type.
  stockFor(shortfallHours: number): Fleet {
    if (this.stock) return this.stock;
    const counts = this.catalog.types.map((t): [string, number] => [
      t.name,
      Math.ceil(shortfallHours / t.hoursPerDay),
    ]);
    return unwrap(Fleet.create(this.catalog, Object.fromEntries(counts)));
  }

  take(robots: Fleet): Warehouse {
    return this.stock ? new Warehouse(this.catalog, this.stock.minus(robots)) : this;
  }
}
