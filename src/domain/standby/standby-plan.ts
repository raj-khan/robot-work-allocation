import type { Fleet } from '../fleet.js';

// Active robots used plus any standby robots activated for one request.
export class StandbyPlan {
  constructor(
    readonly requestedHours: number,
    readonly activeCapacity: number,
    readonly activeRobots: Fleet,
    readonly standbyRobots: Fleet,
  ) {}

  get needsStandby(): boolean {
    return !this.standbyRobots.isEmpty;
  }

  get providedHours(): number {
    return this.activeRobots.totalHours + this.standbyRobots.totalHours;
  }

  get totalCost(): number {
    return this.activeRobots.totalCost + this.standbyRobots.totalCost;
  }
}
