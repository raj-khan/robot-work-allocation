import type { AllocationStrategy } from './allocation-strategy.js';
import { err, ok, unwrap, type Result } from '../../shared/result.js';
import { Allocation } from '../allocation.js';
import { AllocationError } from '../errors.js';
import { Fleet } from '../fleet.js';
import { findOptimalAllocation } from '../optimiser/find-optimal-allocation.js';
import { LEAST_EXCESS } from '../optimiser/objectives.js';
import { validateWorkHours } from '../work-hours.js';

/**
 * Level 1: reserve one robot of every type, then top up with the least excess
 * hours. Ties go to the cheaper mix, then fewer robots.
 */
export class CategoryDistributionStrategy implements AllocationStrategy {
  readonly name = 'Category distribution';

  allocate(available: Fleet, requestedHours: number): Result<Allocation, AllocationError> {
    const hours = validateWorkHours(requestedHours);
    if (!hours.ok) return hours;
    if (available.isEmpty) return err(new AllocationError('NO_ROBOTS'));
    if (available.entries().some(({ count }) => count === 0)) {
      return err(new AllocationError('CATEGORY_DISTRIBUTION_IMPOSSIBLE'));
    }

    const base = oneOfEach(available);
    const remaining = Math.max(0, requestedHours - base.totalHours);
    const topUp = findOptimalAllocation(available.minus(base), remaining, LEAST_EXCESS);
    if (!topUp) return err(new AllocationError('INSUFFICIENT_CAPACITY'));

    return ok(Allocation.of(base.plus(topUp.robots), requestedHours));
  }
}

function oneOfEach(available: Fleet): Fleet {
  return unwrap(
    Fleet.create(available.catalog, Object.fromEntries(available.catalog.names.map((n) => [n, 1]))),
  );
}
