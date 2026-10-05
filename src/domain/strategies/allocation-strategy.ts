import type { Result } from '../../shared/result.js';
import type { Allocation } from '../allocation.js';
import type { AllocationError } from '../errors.js';
import type { Fleet } from '../fleet.js';

export interface AllocationStrategy {
  readonly name: string;
  allocate(available: Fleet, requestedHours: number): Result<Allocation, AllocationError>;
}
