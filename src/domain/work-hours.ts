import { z } from 'zod';

import { AllocationError } from './errors.js';
import { err, ok, type Result } from '../shared/result.js';

export const workHoursSchema = z.number().int().positive();

export function validateWorkHours(hours: number): Result<number, AllocationError> {
  return workHoursSchema.safeParse(hours).success
    ? ok(hours)
    : err(new AllocationError('INVALID_WORK_HOURS'));
}
