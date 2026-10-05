import { describe, expect, it } from 'vitest';

import { pipe } from './pipe.js';

describe('pipe', () => {
  it('returns the input when given no steps', () => {
    expect(pipe(5)).toBe(5);
  });

  it('applies steps left to right', () => {
    const result = pipe(
      ' 12 ',
      (text: string) => text.trim(),
      (text: string) => Number(text),
      (hours: number) => hours * 2,
    );

    expect(result).toBe(24);
  });
});
