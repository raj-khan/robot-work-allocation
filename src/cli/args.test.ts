import { describe, expect, it } from 'vitest';

import { parseCliArgs } from './args.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';

describe('parseCliArgs', () => {
  it('returns nothing set for no arguments', () => {
    expect(parseCliArgs([], DEFAULT_CATALOG)).toEqual({
      ok: true,
      value: { help: false, active: {}, standby: {}, hours: undefined },
    });
  });

  it('reads robot counts per catalog type, hours and standby stock', () => {
    const result = parseCliArgs(
      ['--bravo', '2', '--delta=1', '--hours', '12,16', '--standby-charlie', '3'],
      DEFAULT_CATALOG,
    );

    expect(result).toEqual({
      ok: true,
      value: {
        help: false,
        active: { Bravo: '2', Delta: '1' },
        standby: { Charlie: '3' },
        hours: '12,16',
      },
    });
  });

  it('recognises --help', () => {
    expect(parseCliArgs(['-h'], DEFAULT_CATALOG)).toMatchObject({
      ok: true,
      value: { help: true },
    });
  });

  it('rejects unknown options', () => {
    const result = parseCliArgs(['--echo', '1'], DEFAULT_CATALOG);

    expect(!result.ok && result.error).toContain('--echo');
  });
});
