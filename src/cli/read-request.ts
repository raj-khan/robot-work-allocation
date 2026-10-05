import { z } from 'zod';

import type { CliOptions } from './args.js';
import type { Io } from './io.js';
import { parseClientHours } from './parse-client-hours.js';
import { AllocationError } from '../domain/errors.js';
import { Fleet } from '../domain/fleet.js';
import type { RobotCatalog } from '../domain/robot-catalog.js';
import { Warehouse } from '../domain/standby/warehouse.js';
import { err, ok, type Result } from '../shared/result.js';

export interface AllocationRequest {
  readonly active: Fleet;
  readonly warehouse: Warehouse;
  readonly hours: readonly number[];
}

const countSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .refine((n) => Number.isSafeInteger(n));

// Fills gaps left by flags with prompts, then validates everything at once.
export async function readRequest(
  io: Io,
  options: CliOptions,
  catalog: RobotCatalog,
): Promise<Result<AllocationRequest, AllocationError>> {
  const activeText = { ...options.active };
  const missing = catalog.names.filter((name) => activeText[name] === undefined);
  if (missing.length > 0) {
    io.hint('Enter number of robots available:');
    for (const name of missing) activeText[name] = (await io.ask(`${name}: `)) ?? '';
  }
  const active = parseFleet(catalog, activeText);
  if (!active.ok) return active;

  const warehouse = parseWarehouse(catalog, options.standby);
  if (!warehouse.ok) return warehouse;

  let hoursText = options.hours;
  if (hoursText === undefined) {
    if (missing.length > 0) io.hint('');
    hoursText = (await io.ask('Enter client work hours: ')) ?? '';
  }
  const hours = parseClientHours(hoursText);
  if (!hours.ok) return hours;

  return ok({ active: active.value, warehouse: warehouse.value, hours: hours.value });
}

function parseFleet(
  catalog: RobotCatalog,
  texts: Readonly<Record<string, string>>,
): Result<Fleet, AllocationError> {
  const counts: Record<string, number> = {};
  for (const [name, text] of Object.entries(texts)) {
    const parsed = countSchema.safeParse(text);
    if (!parsed.success) return err(new AllocationError('INVALID_ROBOT_COUNT'));
    counts[name] = parsed.data;
  }
  return Fleet.create(catalog, counts);
}

// No standby flags means the brief's open-ended warehouse.
function parseWarehouse(
  catalog: RobotCatalog,
  texts: Readonly<Record<string, string>>,
): Result<Warehouse, AllocationError> {
  if (Object.keys(texts).length === 0) return ok(Warehouse.unlimited(catalog));
  const stock = parseFleet(catalog, texts);
  return stock.ok ? ok(Warehouse.of(stock.value)) : stock;
}
