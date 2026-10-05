import { describe, expect, it } from 'vitest';

import { runCli } from './run-cli.js';
import { FakeIo } from '../test-support/fake-io.js';
import { silentLogger } from '../test-support/silent-logger.js';

const run = async (argv: string[], answers: string[] = []) => {
  const io = new FakeIo(answers);
  const exitCode = await runCli({ argv, io, logger: silentLogger });
  return { io, exitCode };
};

describe('runCli', () => {
  it('reproduces the Level 1 spec example', async () => {
    const { io, exitCode } = await run([], ['2', '3', '2', '16']);

    expect(exitCode).toBe(0);
    expect(io.text).toContain(
      [
        'Robot Assignment',
        'Bravo: 1',
        'Charlie: 1',
        'Delta: 1',
        '',
        'Total Work Hours Provided: 16',
        'Client Work Hours Requested: 16',
      ].join('\n'),
    );
  });

  it('reproduces Level 2 example 1 and the comparison', async () => {
    const { io } = await run(['--bravo', '2', '--charlie', '3', '--delta', '2', '--hours', '20']);

    expect(io.text).toContain(
      [
        'Cost Optimized Allocation',
        'Charlie: 1',
        'Delta: 2',
        '',
        'Total Hours Provided: 21',
        'Total Charging Cost: $11',
      ].join('\n'),
    );
    expect(io.text).toContain(
      ['Level 1 Cost: $12', 'Level 2 Cost: $11', 'Cost Difference: $1'].join('\n'),
    );
    expect(io.text).toContain(
      'Insight: Level 1 strategy resulted in $1 additional cost due to mandatory usage of multiple robot categories.',
    );
  });

  it('reproduces Level 2 example 2', async () => {
    const { io } = await run(['--bravo', '2', '--charlie', '2', '--delta', '3', '--hours', '6']);

    expect(io.text).toContain(
      [
        'Cost Optimized Allocation',
        'Bravo: 2',
        '',
        'Total Hours Provided: 6',
        'Total Charging Cost: $4',
      ].join('\n'),
    );
  });

  it('reproduces the Level 3 spec example', async () => {
    const { io } = await run(['--bravo', '1', '--charlie', '1', '--delta', '1', '--hours', '21']);

    expect(io.text).toContain(
      [
        'Active Robot Capacity: 16 hours',
        'Client Work Requested: 21 hours',
        'Additional Standby Robots Required:',
        'Charlie: 1 - cost $3',
      ].join('\n'),
    );
    expect(io.text).toContain('Error: Insufficient robot capacity to complete the requested work.');
  });

  it('serves several clients by priority and prints the summary', async () => {
    const { io } = await run([
      '--bravo',
      '2',
      '--charlie',
      '3',
      '--delta',
      '2',
      '--hours',
      '12 16 17 10 21',
    ]);

    expect(io.text).toContain('Clients by priority: 21, 17, 16, 12, 10');
    expect(io.text).toContain('Client 5: 21 hours');
    expect(io.text).toContain('Allocation Summary');
    expect(io.text).toContain('Total Charging Cost: $');
    expect(io.text).toMatch(/Bravo utilization: \d+(\.\d)?%/);
  });

  it('shows the zero robots error from the brief', async () => {
    const { io } = await run([
      '--bravo',
      '0',
      '--charlie',
      '0',
      '--delta',
      '0',
      '--hours',
      '5',
      '--standby-delta',
      '0',
    ]);

    expect(io.text).toContain('Error: No robots available for assignment.');
  });

  it('shows the impossible allocation error from the brief', async () => {
    const { io } = await run(['--bravo', '0', '--charlie', '1', '--delta', '1', '--hours', '5']);

    expect(io.text).toContain(
      'Error: Unable to allocate at least one robot from each category with the available inventory.',
    );
  });

  it('exits 1 with the brief message on invalid hours', async () => {
    const { io, exitCode } = await run([
      '--bravo',
      '1',
      '--charlie',
      '1',
      '--delta',
      '1',
      '--hours',
      'abc',
    ]);

    expect(exitCode).toBe(1);
    expect(io.err).toEqual(['Error: Work hours must be a positive integer.']);
  });

  it('exits 1 on unknown options', async () => {
    const { io, exitCode } = await run(['--nope']);

    expect(exitCode).toBe(1);
    expect(io.err[0]).toContain('--nope');
  });

  it('prints usage for --help', async () => {
    const { io, exitCode } = await run(['--help']);

    expect(exitCode).toBe(0);
    expect(io.text).toContain('Usage: robot-allocate');
    expect(io.text).toContain('--standby-delta');
  });
});
