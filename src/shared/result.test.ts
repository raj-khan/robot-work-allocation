import { describe, expect, it } from 'vitest';

import { err, ok, unwrap } from './result.js';

describe('Result', () => {
  it('wraps a success value', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });

  it('wraps a failure', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' });
  });

  it('unwraps a success and throws the error of a failure', () => {
    expect(unwrap(ok(3))).toBe(3);
    expect(() => unwrap(err(new Error('boom')))).toThrow('boom');
  });
});
