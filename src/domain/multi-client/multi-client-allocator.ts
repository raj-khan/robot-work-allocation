import type { Result } from '../../shared/result.js';
import type { AllocationError } from '../errors.js';
import type { Fleet } from '../fleet.js';
import { StandbyActivation } from '../standby/standby-activation.js';
import type { StandbyPlan } from '../standby/standby-plan.js';
import type { Warehouse } from '../standby/warehouse.js';

export interface Client {
  // 1-based position in the original input.
  readonly id: number;
  readonly hours: number;
}

export interface ClientOutcome {
  readonly client: Client;
  readonly result: Result<StandbyPlan, AllocationError>;
}

export interface MultiClientRun {
  readonly initialActive: Fleet;
  readonly outcomes: readonly ClientOutcome[];
  readonly remainingActive: Fleet;
}

/**
 * Level 4: serve clients by highest hours first from one shared active pool,
 * activating standby robots once it runs out. A failed client does not stop the rest.
 */
export class MultiClientAllocator {
  constructor(private readonly standby: StandbyActivation = new StandbyActivation()) {}

  allocate(hours: readonly number[], active: Fleet, warehouse: Warehouse): MultiClientRun {
    let pool = active;
    let stock = warehouse;
    const outcomes: ClientOutcome[] = [];

    for (const client of byPriority(hours)) {
      const result = this.standby.plan(pool, client.hours, stock);
      if (result.ok) {
        pool = pool.minus(result.value.activeRobots);
        stock = stock.take(result.value.standbyRobots);
      }
      outcomes.push({ client, result });
    }

    return { initialActive: active, outcomes, remainingActive: pool };
  }
}

// Array.prototype.sort is stable, so equal requests keep their input order.
function byPriority(hours: readonly number[]): Client[] {
  return hours.map((h, i) => ({ id: i + 1, hours: h })).sort((a, b) => b.hours - a.hours);
}
