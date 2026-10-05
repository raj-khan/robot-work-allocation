import type { AllocationStrategy } from './allocation-strategy.js';
import { err, ok, type Result } from '../../shared/result.js';
import type { Allocation } from '../allocation.js';
import { AllocationError } from '../errors.js';
import type { Fleet } from '../fleet.js';
import { findOptimalAllocation } from '../optimiser/find-optimal-allocation.js';
import { CHEAPEST } from '../optimiser/objectives.js';
import { validateWorkHours } from '../work-hours.js';

/** Level 2: lowest charging cost; ties go to less excess, then fewer robots. */
export class CostOptimisedStrategy implements AllocationStrategy {
  readonly name = 'Cost optimised';

  allocate(available: Fleet, requestedHours: number): Result<Allocation, AllocationError> {
    const hours = validateWorkHours(requestedHours);
    if (!hours.ok) return hours;
    if (available.isEmpty) return err(new AllocationError('NO_ROBOTS'));

    const allocation = findOptimalAllocation(available, requestedHours, CHEAPEST);
    return allocation ? ok(allocation) : err(new AllocationError('INSUFFICIENT_CAPACITY'));
  }
}
