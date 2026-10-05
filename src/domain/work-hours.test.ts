import { describe, expect, it } from 'vitest';

import { validateWorkHours } from './work-hours.js';

describe('validateWorkHours', () => {
  it('accepts positive integers', () => {
    expect(validateWorkHours(16)).toEqual({ ok: true, value: 16 });
  });

  it.each([0, -3, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (hours) => {
    const result = validateWorkHours(hours);

    expect(!result.ok && result.error.code).toBe('INVALID_WORK_HOURS');
  });
});
