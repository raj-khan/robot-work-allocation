import { describe, expect, it } from 'vitest';

import { MAX_WORK_HOURS, parseClientHours } from './parse-client-hours.js';

describe('parseClientHours', () => {
  it.each([
    ['20', [20]],
    ['12,16,17,10,21', [12, 16, 17, 10, 21]],
    ['12 16 17 10 21', [12, 16, 17, 10, 21]],
    ['  12, 16  17 ,10 ', [12, 16, 17, 10]],
  ])('parses "%s"', (input, expected) => {
    expect(parseClientHours(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['', '   ', '0', '-4', '1.5', 'abc', '12,,x', '1e3', '0x10'])(
    'rejects "%s" with the spec message',
    (input) => {
      const result = parseClientHours(input);

      expect(!result.ok && result.error.message).toBe('Work hours must be a positive integer.');
    },
  );

  it('rejects requests above the supported maximum', () => {
    const result = parseClientHours(String(MAX_WORK_HOURS + 1));

    expect(!result.ok && result.error.code).toBe('WORK_HOURS_TOO_LARGE');
  });
});
