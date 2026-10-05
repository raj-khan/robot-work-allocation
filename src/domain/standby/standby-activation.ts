import { StandbyPlan } from './standby-plan.js';
import type { Warehouse } from './warehouse.js';
import { ok, type Result } from '../../shared/result.js';
import type { AllocationError } from '../errors.js';
import { Fleet } from '../fleet.js';
import type { AllocationStrategy } from '../strategies/allocation-strategy.js';
import { CostOptimisedStrategy } from '../strategies/cost-optimised-strategy.js';
import { validateWorkHours } from '../work-hours.js';

/**
 * Level 3: if active robots can cover the request, use the strategy on them.
 * Otherwise use every active robot and cover the shortfall from the warehouse.
 */
export class StandbyActivation {
  constructor(private readonly strategy: AllocationStrategy = new CostOptimisedStrategy()) {}

  plan(
    active: Fleet,
    requestedHours: number,
    warehouse: Warehouse,
  ): Result<StandbyPlan, AllocationError> {
    const hours = validateWorkHours(requestedHours);
    if (!hours.ok) return hours;

    const capacity = active.totalHours;
    if (capacity >= requestedHours) {
      const allocation = this.strategy.allocate(active, requestedHours);
      if (!allocation.ok) return allocation;
      const none = Fleet.empty(active.catalog);
      return ok(new StandbyPlan(requestedHours, capacity, allocation.value.robots, none));
    }

    const shortfall = requestedHours - capacity;
    const standby = this.strategy.allocate(warehouse.stockFor(shortfall), shortfall);
    if (!standby.ok) return standby;
    return ok(new StandbyPlan(requestedHours, capacity, active, standby.value.robots));
  }
}
