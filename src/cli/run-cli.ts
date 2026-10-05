import { parseCliArgs, usage } from './args.js';
import { formatMultiClientReport, formatSingleClientReport } from './format-report.js';
import type { Io } from './io.js';
import { readRequest } from './read-request.js';
import { createAllocationService } from '../application/allocation-service.js';
import { DEFAULT_CATALOG, type RobotCatalog } from '../domain/robot-catalog.js';
import type { Logger } from '../shared/logger.js';
import { pipe } from '../shared/pipe.js';

export interface CliContext {
  readonly argv: readonly string[];
  readonly io: Io;
  readonly logger: Logger;
  readonly catalog?: RobotCatalog;
}

// Returns the process exit code: 0 on a report, 1 on bad input.
export async function runCli({
  argv,
  io,
  logger,
  catalog = DEFAULT_CATALOG,
}: CliContext): Promise<number> {
  const options = parseCliArgs(argv, catalog);
  if (!options.ok) {
    io.printError(`Error: ${options.error}`);
    io.printError('Run with --help to see the options.');
    return 1;
  }
  if (options.value.help) {
    usage(catalog).forEach((line) => {
      io.print(line);
    });
    return 0;
  }

  const request = await readRequest(io, options.value, catalog);
  if (!request.ok) {
    logger.debug({ code: request.error.code }, 'invalid input');
    io.printError(`Error: ${request.error.message}`);
    return 1;
  }

  const service = createAllocationService(logger);
  const { active, hours, warehouse } = request.value;
  const [only, ...rest] = hours;
  const lines =
    only !== undefined && rest.length === 0
      ? pipe(service.allocateSingle(active, only, warehouse), formatSingleClientReport)
      : pipe(service.allocateMany(active, hours, warehouse), formatMultiClientReport);

  lines.forEach((line) => {
    io.print(line);
  });
  return 0;
}
