import { pino } from 'pino';

import type { Config } from './env.js';
import type { Logger } from '../shared/logger.js';

// JSON logs go to stderr so stdout stays clean for the report.
export function createLogger(level: Config['logLevel']): Logger {
  return pino({ level, base: null }, pino.destination({ dest: 2, sync: true }));
}
