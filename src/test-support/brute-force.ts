import { Allocation } from '../domain/allocation.js';
import { Fleet } from '../domain/fleet.js';
import { compareRanks, type Objective } from '../domain/optimiser/objectives.js';

// Tries every combination; slow but obviously correct, used as a test oracle.
export function bruteForce(
  available: Fleet,
  requestedHours: number,
  objective: Objective,
): Allocation | undefined {
  const names = available.catalog.names;
  let best: Allocation | undefined;

  const visit = (index: number, counts: Record<string, number>): void => {
    const name = names[index];
    if (name === undefined) {
      const fleet = Fleet.create(available.catalog, counts);
      if (!fleet.ok || fleet.value.totalHours < requestedHours) return;
      const candidate = Allocation.of(fleet.value, requestedHours);
      if (!best || compareRanks(objective.rank(candidate), objective.rank(best)) < 0) {
        best = candidate;
      }
      return;
    }
    for (let count = 0; count <= available.count(name); count++) {
      visit(index + 1, { ...counts, [name]: count });
    }
  };

  visit(0, {});
  return best;
}
