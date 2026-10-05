import { z } from 'zod';

import { AllocationError } from '../domain/errors.js';
import { err, ok, type Result } from '../shared/result.js';

// Keeps the optimiser well under a second per client.
export const MAX_WORK_HOURS = 100_000;

const tokenSchema = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive());

// Accepts one value or several separated by commas and/or spaces.
export function parseClientHours(input: string): Result<number[], AllocationError> {
  const tokens = input.split(/[\s,]+/).filter((token) => token !== '');
  if (tokens.length === 0) return err(new AllocationError('INVALID_WORK_HOURS'));

  const hours: number[] = [];
  for (const token of tokens) {
    const parsed = tokenSchema.safeParse(token);
    if (!parsed.success) return err(new AllocationError('INVALID_WORK_HOURS'));
    if (parsed.data > MAX_WORK_HOURS) {
      return err(new AllocationError('WORK_HOURS_TOO_LARGE', String(MAX_WORK_HOURS)));
    }
    hours.push(parsed.data);
  }
  return ok(hours);
}
