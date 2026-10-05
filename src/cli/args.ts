import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';

import type { RobotCatalog } from '../domain/robot-catalog.js';
import { err, ok, type Result } from '../shared/result.js';

export interface CliOptions {
  readonly help: boolean;
  // Raw text per robot type; validated later with the prompted values.
  readonly active: Readonly<Record<string, string>>;
  readonly standby: Readonly<Record<string, string>>;
  readonly hours: string | undefined;
}

const flagFor = (name: string): string => name.toLowerCase();
const standbyFlagFor = (name: string): string => `standby-${flagFor(name)}`;

// Flags come from the catalog, so a new robot type gets its own flag for free.
export function parseCliArgs(
  argv: readonly string[],
  catalog: RobotCatalog,
): Result<CliOptions, string> {
  const robotFlags = catalog.names.flatMap((name) => [flagFor(name), standbyFlagFor(name)]);
  const options: ParseArgsOptionsConfig = {
    help: { type: 'boolean', short: 'h' },
    hours: { type: 'string' },
  };
  for (const flag of robotFlags) options[flag] = { type: 'string' };

  let values: Record<string, string | boolean | (string | boolean)[] | undefined>;
  try {
    ({ values } = parseArgs({ args: [...argv], options, strict: true, allowPositionals: false }));
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error));
  }

  const text = (key: string): string | undefined => {
    const value = values[key];
    return typeof value === 'string' ? value : undefined;
  };
  const pick = (toFlag: (name: string) => string): Record<string, string> =>
    Object.fromEntries(
      catalog.names.flatMap((name) => {
        const value = text(toFlag(name));
        return value === undefined ? [] : [[name, value]];
      }),
    );

  return ok({
    help: values['help'] === true,
    active: pick(flagFor),
    standby: pick(standbyFlagFor),
    hours: text('hours'),
  });
}

export function usage(catalog: RobotCatalog): string[] {
  return [
    'Usage: robot-allocate [options]',
    '',
    'Assigns EverBot robots to client work. Prompts for anything not given as a flag.',
    '',
    'Options:',
    ...catalog.names.map((name) => `  --${flagFor(name)} <n>`.padEnd(28) + `Active ${name} robots`),
    '  --hours <list>'.padEnd(28) + 'Client hours, e.g. 20 or "12,16,17" or "12 16 17"',
    ...catalog.names.map(
      (name) =>
        `  --${standbyFlagFor(name)} <n>`.padEnd(28) + `Standby ${name} stock (default unlimited)`,
    ),
    '  -h, --help'.padEnd(28) + 'Show this help',
    '',
    'Environment:',
    '  LOG_LEVEL'.padEnd(28) +
      'fatal|error|warn|info|debug|trace|silent (default warn), logs go to stderr',
  ];
}
