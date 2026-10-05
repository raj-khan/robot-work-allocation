#!/usr/bin/env node
import { createConsoleIo } from './cli/io.js';
import { runCli } from './cli/run-cli.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';

const config = loadConfig(process.env);
if (!config.ok) {
  process.stderr.write(`Error: invalid environment\n${config.error}\n`);
  process.exitCode = 1;
} else {
  const logger = createLogger(config.value.logLevel);
  const io = createConsoleIo(process.stdin, process.stdout, process.stderr);
  try {
    process.exitCode = await runCli({ argv: process.argv.slice(2), io, logger });
  } catch (error) {
    logger.error({ err: error }, 'unexpected failure');
    io.printError('Error: Something went wrong. Run with LOG_LEVEL=debug for details.');
    process.exitCode = 2;
  } finally {
    io.close();
  }
}
