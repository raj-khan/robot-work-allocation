import { Fleet } from '../domain/fleet.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';

// Test shortcut: builds a default-catalog fleet and fails loudly on bad input.
export function fleetOf(counts: Readonly<Record<string, number>>): Fleet {
  const result = Fleet.create(DEFAULT_CATALOG, counts);
  if (!result.ok) throw result.error;
  return result.value;
}
