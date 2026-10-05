import { z } from 'zod';

import { err, ok, type Result } from '../shared/result.js';

const envSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('warn'),
});

export interface Config {
  readonly logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
}

export function loadConfig(
  env: Readonly<Record<string, string | undefined>>,
): Result<Config, string> {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) return err(z.prettifyError(parsed.error));
  return ok({ logLevel: parsed.data.LOG_LEVEL });
}
