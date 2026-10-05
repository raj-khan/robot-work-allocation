import { z } from 'zod';

import { AllocationError } from './errors.js';
import type { RobotCatalog, RobotType } from './robot-catalog.js';
import { err, ok, type Result } from '../shared/result.js';

const robotCountSchema = z.number().int().nonnegative();

export interface FleetEntry {
  readonly type: RobotType;
  readonly count: number;
}

// Immutable count of robots per type, always tied to one catalog.
export class Fleet {
  private constructor(
    readonly catalog: RobotCatalog,
    private readonly counts: ReadonlyMap<string, number>,
  ) {}

  static empty(catalog: RobotCatalog): Fleet {
    return new Fleet(catalog, new Map());
  }

  static create(
    catalog: RobotCatalog,
    counts: Readonly<Record<string, number>>,
  ): Result<Fleet, AllocationError> {
    for (const [name, count] of Object.entries(counts)) {
      if (!catalog.find(name)) return err(new AllocationError('UNKNOWN_ROBOT_TYPE', name));
      if (!robotCountSchema.safeParse(count).success) {
        return err(new AllocationError('INVALID_ROBOT_COUNT'));
      }
    }
    return ok(new Fleet(catalog, new Map(Object.entries(counts))));
  }

  count(name: string): number {
    return this.counts.get(name) ?? 0;
  }

  entries(): FleetEntry[] {
    return this.catalog.types.map((type) => ({ type, count: this.count(type.name) }));
  }

  inUse(): FleetEntry[] {
    return this.entries().filter((entry) => entry.count > 0);
  }

  get totalRobots(): number {
    return this.sum(() => 1);
  }

  get totalHours(): number {
    return this.sum((type) => type.hoursPerDay);
  }

  get totalCost(): number {
    return this.sum((type) => type.costPerDay);
  }

  get isEmpty(): boolean {
    return this.totalRobots === 0;
  }

  plus(other: Fleet): Fleet {
    return this.combine(other, (a, b) => a + b);
  }

  minus(other: Fleet): Fleet {
    return this.combine(other, (a, b) => {
      if (b > a) throw new RangeError('Cannot remove more robots than the fleet holds');
      return a - b;
    });
  }

  private sum(perRobot: (type: RobotType) => number): number {
    return this.entries().reduce((total, { type, count }) => total + perRobot(type) * count, 0);
  }

  private combine(other: Fleet, op: (a: number, b: number) => number): Fleet {
    if (other.catalog !== this.catalog) throw new TypeError('Fleets use different catalogs');
    const counts = new Map(
      this.catalog.names.map((name) => [name, op(this.count(name), other.count(name))]),
    );
    return new Fleet(this.catalog, counts);
  }
}
