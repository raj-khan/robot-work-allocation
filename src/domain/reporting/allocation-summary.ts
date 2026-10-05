import { Fleet } from '../fleet.js';
import type { MultiClientRun } from '../multi-client/multi-client-allocator.js';
import type { StandbyPlan } from '../standby/standby-plan.js';

export interface TypeUsage {
  readonly name: string;
  readonly activeAvailable: number;
  readonly activeUsed: number;
  readonly standbyActivated: number;
  // Share of the active fleet put to work; undefined when none were available.
  readonly utilisation: number | undefined;
}

export interface AllocationSummary {
  readonly clientsServed: number;
  readonly clientsFailed: number;
  readonly totalRobotsUsed: number;
  readonly standbyRobotsActivated: number;
  readonly totalChargingCost: number;
  readonly hoursRequested: number;
  readonly hoursProvided: number;
  // Requested over provided hours for served clients; 1 means no idle robot time.
  readonly averageUtilisation: number | undefined;
  readonly byType: readonly TypeUsage[];
}

export function summarise(run: MultiClientRun): AllocationSummary {
  const plans = run.outcomes.flatMap((o) => (o.result.ok ? [o.result.value] : []));
  const activeUsed = run.initialActive.minus(run.remainingActive);
  const standby = plans.reduce(
    (total, plan) => total.plus(plan.standbyRobots),
    Fleet.empty(run.initialActive.catalog),
  );
  const hoursRequested = sum(plans, (p) => p.requestedHours);
  const hoursProvided = sum(plans, (p) => p.providedHours);

  return {
    clientsServed: plans.length,
    clientsFailed: run.outcomes.length - plans.length,
    totalRobotsUsed: activeUsed.totalRobots + standby.totalRobots,
    standbyRobotsActivated: standby.totalRobots,
    totalChargingCost: sum(plans, (p) => p.totalCost),
    hoursRequested,
    hoursProvided,
    averageUtilisation: ratio(hoursRequested, hoursProvided),
    byType: run.initialActive.entries().map(({ type, count }) => ({
      name: type.name,
      activeAvailable: count,
      activeUsed: activeUsed.count(type.name),
      standbyActivated: standby.count(type.name),
      utilisation: ratio(activeUsed.count(type.name), count),
    })),
  };
}

function sum(plans: readonly StandbyPlan[], pick: (plan: StandbyPlan) => number): number {
  return plans.reduce((total, plan) => total + pick(plan), 0);
}

function ratio(part: number, whole: number): number | undefined {
  return whole === 0 ? undefined : part / whole;
}
