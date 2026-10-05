import { compareRanks, type Objective } from './objectives.js';
import { unwrap } from '../../shared/result.js';
import { Allocation } from '../allocation.js';
import { Fleet } from '../fleet.js';

interface Item {
  readonly typeIndex: number;
  readonly units: number;
  readonly hours: number;
  readonly cost: number;
}

interface State {
  readonly cost: number;
  readonly robots: number;
  readonly counts: readonly number[];
}

/**
 * Bounded knapsack over hours. For each exact hour total it keeps the cheapest,
 * then smallest, set of robots, then the objective picks among the totals.
 *
 * Objectives must prefer lower cost and fewer robots when hours are equal.
 */
export function findOptimalAllocation(
  available: Fleet,
  requestedHours: number,
  objective: Objective,
): Allocation | undefined {
  if (available.totalHours < requestedHours) return undefined;

  const cap = hoursCap(available, requestedHours);
  const states = solve(available, cap);

  let best: Allocation | undefined;
  for (let hours = requestedHours; hours <= cap; hours++) {
    const state = states[hours];
    if (!state) continue;
    const candidate = Allocation.of(toFleet(available, state.counts), requestedHours);
    if (!best || compareRanks(objective.rank(candidate), objective.rank(best)) < 0) {
      best = candidate;
    }
  }
  return best;
}

// A minimal cover never overshoots by a full robot, so totals past this are never optimal.
function hoursCap(available: Fleet, requestedHours: number): number {
  const largest = Math.max(0, ...available.inUse().map(({ type }) => type.hoursPerDay));
  return Math.max(requestedHours, Math.min(available.totalHours, requestedHours + largest - 1));
}

function solve(available: Fleet, cap: number): (State | undefined)[] {
  const typeCount = available.catalog.types.length;
  const states: (State | undefined)[] = new Array<State | undefined>(cap + 1);
  states[0] = { cost: 0, robots: 0, counts: new Array<number>(typeCount).fill(0) };

  for (const item of splitIntoItems(available, cap)) {
    for (let hours = cap - item.hours; hours >= 0; hours--) {
      const from = states[hours];
      if (!from) continue;
      const next = extend(from, item);
      const target = hours + item.hours;
      if (isBetter(next, states[target])) states[target] = next;
    }
  }
  return states;
}

// Binary splitting turns n copies of a robot into log(n) 0/1 items.
function splitIntoItems(available: Fleet, cap: number): Item[] {
  return available.entries().flatMap(({ type, count }, typeIndex) => {
    const items: Item[] = [];
    let remaining = Math.min(count, Math.ceil(cap / type.hoursPerDay));
    for (let chunk = 1; remaining > 0; chunk *= 2) {
      const units = Math.min(chunk, remaining);
      items.push({
        typeIndex,
        units,
        hours: units * type.hoursPerDay,
        cost: units * type.costPerDay,
      });
      remaining -= units;
    }
    return items;
  });
}

function extend(state: State, item: Item): State {
  const counts = [...state.counts];
  counts[item.typeIndex] = (counts[item.typeIndex] ?? 0) + item.units;
  return { cost: state.cost + item.cost, robots: state.robots + item.units, counts };
}

function isBetter(candidate: State, current: State | undefined): boolean {
  if (!current) return true;
  return compareRanks([candidate.cost, candidate.robots], [current.cost, current.robots]) < 0;
}

function toFleet(available: Fleet, counts: readonly number[]): Fleet {
  const names = available.catalog.names;
  return unwrap(
    Fleet.create(available.catalog, Object.fromEntries(names.map((n, i) => [n, counts[i] ?? 0]))),
  );
}
