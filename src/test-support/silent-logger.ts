import type { Logger } from '../shared/logger.js';

const noop = (): void => undefined;

export const silentLogger: Logger = { debug: noop, info: noop, warn: noop, error: noop };
