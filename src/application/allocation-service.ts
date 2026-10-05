import type { Allocation } from '../domain/allocation.js';
import type { AllocationError } from '../domain/errors.js';
import type { Fleet } from '../domain/fleet.js';
import {
  MultiClientAllocator,
  type MultiClientRun,
} from '../domain/multi-client/multi-client-allocator.js';
import { summarise, type AllocationSummary } from '../domain/reporting/allocation-summary.js';
import { StandbyActivation } from '../domain/standby/standby-activation.js';
import type { StandbyPlan } from '../domain/standby/standby-plan.js';
import type { Warehouse } from '../domain/standby/warehouse.js';
import type { AllocationStrategy } from '../domain/strategies/allocation-strategy.js';
import { CategoryDistributionStrategy } from '../domain/strategies/category-distribution-strategy.js';
import { CostOptimisedStrategy } from '../domain/strategies/cost-optimised-strategy.js';
import { compareStrategies, type StrategyComparison } from '../domain/strategy-comparison.js';
import type { Logger } from '../shared/logger.js';
import type { Result } from '../shared/result.js';

export interface SingleClientReport {
  readonly categoryDistribution: Result<Allocation, AllocationError>;
  readonly costOptimised: Result<Allocation, AllocationError>;
  readonly comparison: StrategyComparison | undefined;
  readonly standby: Result<StandbyPlan, AllocationError>;
}

export interface MultiClientReport {
  readonly run: MultiClientRun;
  readonly summary: AllocationSummary;
}

export interface AllocationServiceDeps {
  readonly logger: Logger;
  readonly categoryDistribution: AllocationStrategy;
  readonly costOptimised: AllocationStrategy;
  readonly standby: StandbyActivation;
  readonly multiClient: MultiClientAllocator;
}

// Use cases behind the CLI: one client runs Levels 1 to 3, several run Level 4.
export class AllocationService {
  constructor(private readonly deps: AllocationServiceDeps) {}

  allocateSingle(active: Fleet, hours: number, warehouse: Warehouse): SingleClientReport {
    const categoryDistribution = this.deps.categoryDistribution.allocate(active, hours);
    const costOptimised = this.deps.costOptimised.allocate(active, hours);
    const comparison =
      categoryDistribution.ok && costOptimised.ok
        ? compareStrategies(categoryDistribution.value, costOptimised.value)
        : undefined;
    const standby = this.deps.standby.plan(active, hours, warehouse);

    this.deps.logger.info(
      { hours, activeRobots: active.totalRobots, standbyOk: standby.ok },
      'single client allocated',
    );
    return { categoryDistribution, costOptimised, comparison, standby };
  }

  allocateMany(active: Fleet, hours: readonly number[], warehouse: Warehouse): MultiClientReport {
    const run = this.deps.multiClient.allocate(hours, active, warehouse);
    const summary = summarise(run);

    this.deps.logger.info(
      { clients: hours.length, failed: summary.clientsFailed, cost: summary.totalChargingCost },
      'multiple clients allocated',
    );
    return { run, summary };
  }
}

// Composition root for the default wiring.
export function createAllocationService(logger: Logger): AllocationService {
  const costOptimised = new CostOptimisedStrategy();
  const standby = new StandbyActivation(costOptimised);
  return new AllocationService({
    logger,
    categoryDistribution: new CategoryDistributionStrategy(),
    costOptimised,
    standby,
    multiClient: new MultiClientAllocator(standby),
  });
}
