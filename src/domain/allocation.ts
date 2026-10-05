import type { Fleet } from './fleet.js';

// A set of robots that covers a client request.
export class Allocation {
  private constructor(
    readonly robots: Fleet,
    readonly requestedHours: number,
  ) {}

  static of(robots: Fleet, requestedHours: number): Allocation {
    if (robots.totalHours < requestedHours) {
      throw new RangeError('Allocation does not cover the requested hours');
    }
    return new Allocation(robots, requestedHours);
  }

  get providedHours(): number {
    return this.robots.totalHours;
  }

  get cost(): number {
    return this.robots.totalCost;
  }

  get excessHours(): number {
    return this.providedHours - this.requestedHours;
  }
}
