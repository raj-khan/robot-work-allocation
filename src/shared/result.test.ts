import { describe, expect, it } from 'vitest';

import { err, ok } from './result.js';

describe('Result', () => {
  it('wraps a success value', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });

  it('wraps a failure', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' });
  });
});
