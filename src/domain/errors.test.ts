import { describe, expect, it } from 'vitest';

import { AllocationError } from './errors.js';

describe('AllocationError', () => {
  it.each([
    ['INSUFFICIENT_CAPACITY', 'Insufficient robot capacity to complete the requested work.'],
    [
      'CATEGORY_DISTRIBUTION_IMPOSSIBLE',
      'Unable to allocate at least one robot from each category with the available inventory.',
    ],
    ['NO_ROBOTS', 'No robots available for assignment.'],
    ['INVALID_WORK_HOURS', 'Work hours must be a positive integer.'],
    ['INVALID_ROBOT_COUNT', 'Robot counts must be non-negative integers.'],
  ] as const)('uses the spec message for %s', (code, message) => {
    const error = new AllocationError(code);

    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
    expect(error).toBeInstanceOf(Error);
  });

  it('allows extra detail for unknown robot types', () => {
    expect(new AllocationError('UNKNOWN_ROBOT_TYPE', 'Echo').message).toBe(
      'Unknown robot type: Echo.',
    );
  });
});
