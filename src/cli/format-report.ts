import type { MultiClientReport, SingleClientReport } from '../application/allocation-service.js';
import type { Allocation } from '../domain/allocation.js';
import type { AllocationError } from '../domain/errors.js';
import type { Fleet } from '../domain/fleet.js';
import type { ClientOutcome } from '../domain/multi-client/multi-client-allocator.js';
import type { AllocationSummary } from '../domain/reporting/allocation-summary.js';
import type { StandbyPlan } from '../domain/standby/standby-plan.js';
import type { StrategyComparison } from '../domain/strategy-comparison.js';
import type { Result } from '../shared/result.js';

// Output wording follows the brief, including its US spelling.

const money = (amount: number): string => `$${amount}`;
const percent = (ratio: number | undefined): string =>
  ratio === undefined ? 'n/a' : `${(ratio * 100).toFixed(1)}%`;
const heading = (title: string): string[] => ['', `=== ${title} ===`];
const errorLine = (error: AllocationError): string => `Error: ${error.message}`;
const robotLines = (fleet: Fleet): string[] =>
  fleet.inUse().map(({ type, count }) => `${type.name}: ${count}`);
const standbyLines = (fleet: Fleet): string[] =>
  fleet
    .inUse()
    .map(({ type, count }) => `${type.name}: ${count} - cost ${money(count * type.costPerDay)}`);

function orError<T>(result: Result<T, AllocationError>, render: (value: T) => string[]): string[] {
  return result.ok ? render(result.value) : [errorLine(result.error)];
}

export function formatCategoryDistribution(result: Result<Allocation, AllocationError>): string[] {
  return [
    ...heading('Level 1: Category Distribution'),
    ...orError(result, (a) => [
      'Robot Assignment',
      ...robotLines(a.robots),
      '',
      `Total Work Hours Provided: ${a.providedHours}`,
      `Client Work Hours Requested: ${a.requestedHours}`,
      `Total Charging Cost: ${money(a.cost)}`,
    ]),
  ];
}

export function formatCostOptimised(result: Result<Allocation, AllocationError>): string[] {
  return [
    ...heading('Level 2: Cost Optimised'),
    ...orError(result, (a) => [
      'Cost Optimized Allocation',
      ...robotLines(a.robots),
      '',
      `Total Hours Provided: ${a.providedHours}`,
      `Total Charging Cost: ${money(a.cost)}`,
    ]),
  ];
}

export function formatComparison(comparison: StrategyComparison | undefined): string[] {
  const title = heading('Level 1 vs Level 2 Comparison');
  if (!comparison) return [...title, 'Comparison skipped: both levels need a valid allocation.'];

  const { baselineCost, optimisedCost, costDifference } = comparison;
  const insight =
    costDifference > 0
      ? `Insight: Level 1 strategy resulted in ${money(costDifference)} additional cost due to mandatory usage of multiple robot categories.`
      : 'Insight: Both strategies cost the same, so using every category added no cost here.';
  return [
    ...title,
    `Level 1 Cost: ${money(baselineCost)}`,
    `Level 2 Cost: ${money(optimisedCost)}`,
    `Cost Difference: ${money(costDifference)}`,
    '',
    insight,
  ];
}

export function formatStandby(result: Result<StandbyPlan, AllocationError>): string[] {
  return [
    ...heading('Level 3: Standby Robot Activation'),
    ...orError(result, (plan) =>
      plan.needsStandby
        ? [
            `Active Robot Capacity: ${plan.activeCapacity} hours`,
            `Client Work Requested: ${plan.requestedHours} hours`,
            'Additional Standby Robots Required:',
            ...standbyLines(plan.standbyRobots),
            '',
            `Total Charging Cost (active + standby): ${money(plan.totalCost)}`,
          ]
        : [
            `No standby robots required: active capacity of ${plan.activeCapacity} hours covers ${plan.requestedHours} hours.`,
          ],
    ),
  ];
}

export function formatSingleClientReport(report: SingleClientReport): string[] {
  return [
    ...formatCategoryDistribution(report.categoryDistribution),
    ...formatCostOptimised(report.costOptimised),
    ...formatComparison(report.comparison),
    ...formatStandby(report.standby),
  ];
}

function formatClient({ client, result }: ClientOutcome): string[] {
  return [
    '',
    `Client ${client.id}: ${client.hours} hours`,
    ...orError(result, (plan) => [
      ...(plan.activeRobots.isEmpty
        ? []
        : ['Active Robots Used:', ...robotLines(plan.activeRobots)]),
      ...(plan.needsStandby
        ? ['Additional Standby Robots Required:', ...standbyLines(plan.standbyRobots)]
        : []),
      `Total Hours Provided: ${plan.providedHours}`,
      `Total Charging Cost: ${money(plan.totalCost)}`,
    ]),
  ];
}

function formatSummary(summary: AllocationSummary): string[] {
  return [
    ...heading('Allocation Summary'),
    `Clients Served: ${summary.clientsServed} of ${summary.clientsServed + summary.clientsFailed}`,
    `Total Robots Used: ${summary.totalRobotsUsed} (standby: ${summary.standbyRobotsActivated})`,
    `Total Charging Cost: ${money(summary.totalChargingCost)}`,
    `Avg Robot Utilization: ${percent(summary.averageUtilisation)} (${summary.hoursRequested} of ${summary.hoursProvided} hours used)`,
    ...heading('Efficiency Metrics'),
    ...summary.byType.map(
      (t) =>
        `${t.name} utilization: ${percent(t.utilisation)} (${t.activeUsed} of ${t.activeAvailable} active, ${t.standbyActivated} standby)`,
    ),
  ];
}

export function formatMultiClientReport({ run, summary }: MultiClientReport): string[] {
  return [
    ...heading('Level 4: Multi-Client Allocation'),
    `Clients by priority: ${run.outcomes.map((o) => o.client.hours).join(', ')}`,
    ...run.outcomes.flatMap(formatClient),
    ...formatSummary(summary),
  ];
}
