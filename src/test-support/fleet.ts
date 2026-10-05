import { Fleet } from '../domain/fleet.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';
import { unwrap } from '../shared/result.js';

// Test shortcut: builds a default-catalog fleet and fails loudly on bad input.
export function fleetOf(counts: Readonly<Record<string, number>>): Fleet {
  return unwrap(Fleet.create(DEFAULT_CATALOG, counts));
}
