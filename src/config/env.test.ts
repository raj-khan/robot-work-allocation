import { describe, expect, it } from 'vitest';

import { loadConfig } from './env.js';

describe('loadConfig', () => {
  it('defaults to warn so normal runs stay quiet', () => {
    expect(loadConfig({})).toEqual({ ok: true, value: { logLevel: 'warn' } });
  });

  it('accepts a valid LOG_LEVEL', () => {
    expect(loadConfig({ LOG_LEVEL: 'debug' })).toEqual({ ok: true, value: { logLevel: 'debug' } });
  });

  it('rejects an unknown LOG_LEVEL', () => {
    const result = loadConfig({ LOG_LEVEL: 'loud' });

    expect(!result.ok && result.error).toContain('LOG_LEVEL');
  });
});
