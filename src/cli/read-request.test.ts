import { describe, expect, it } from 'vitest';

import { readRequest } from './read-request.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';
import { FakeIo } from '../test-support/fake-io.js';

const noFlags = { help: false, active: {}, standby: {}, hours: undefined };

describe('readRequest', () => {
  it('prompts like the brief when no flags are given', async () => {
    const io = new FakeIo(['2', '3', '2', '16']);

    const result = await readRequest(io, noFlags, DEFAULT_CATALOG);

    expect(io.out).toEqual([
      'Enter number of robots available:',
      'Bravo: ',
      'Charlie: ',
      'Delta: ',
      '',
      'Enter client work hours: ',
    ]);
    expect(result.ok && result.value.hours).toEqual([16]);
    expect(result.ok && result.value.active.totalRobots).toBe(7);
    expect(result.ok && result.value.warehouse.isUnlimited).toBe(true);
  });

  it('only prompts for what the flags leave out', async () => {
    const io = new FakeIo(['4']);

    const result = await readRequest(
      io,
      { ...noFlags, active: { Bravo: '1', Charlie: '1', Delta: '1' } },
      DEFAULT_CATALOG,
    );

    expect(io.out).toEqual(['Enter client work hours: ']);
    expect(result.ok && result.value.hours).toEqual([4]);
  });

  it('uses finite standby stock when any standby flag is given', async () => {
    const flags = {
      ...noFlags,
      active: { Bravo: '0', Charlie: '0', Delta: '0' },
      hours: '5',
      standby: { Delta: '1' },
    };

    const result = await readRequest(new FakeIo(), flags, DEFAULT_CATALOG);

    expect(result.ok && result.value.warehouse.isUnlimited).toBe(false);
  });

  it.each(['-1', '1.5', 'two', '', '99999999999999999999'])(
    'rejects robot count "%s"',
    async (count) => {
      const result = await readRequest(new FakeIo([count]), noFlags, DEFAULT_CATALOG);

      expect(!result.ok && result.error.message).toBe(
        'Robot counts must be non-negative integers.',
      );
    },
  );

  it('rejects bad standby counts', async () => {
    const flags = {
      ...noFlags,
      active: { Bravo: '1', Charlie: '1', Delta: '1' },
      hours: '5',
      standby: { Delta: 'x' },
    };

    const result = await readRequest(new FakeIo(), flags, DEFAULT_CATALOG);

    expect(!result.ok && result.error.code).toBe('INVALID_ROBOT_COUNT');
  });

  it('rejects invalid hours', async () => {
    const result = await readRequest(new FakeIo(['1', '1', '1', '0']), noFlags, DEFAULT_CATALOG);

    expect(!result.ok && result.error.message).toBe('Work hours must be a positive integer.');
  });

  it('treats closed input as invalid', async () => {
    const result = await readRequest(new FakeIo(['1', '1', '1']), noFlags, DEFAULT_CATALOG);

    expect(!result.ok && result.error.code).toBe('INVALID_WORK_HOURS');
  });
});
