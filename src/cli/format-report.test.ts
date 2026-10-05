import { describe, expect, it } from 'vitest';

import {
  formatComparison,
  formatMultiClientReport,
  formatSingleClientReport,
} from './format-report.js';
import { createAllocationService } from '../application/allocation-service.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';
import { Warehouse } from '../domain/standby/warehouse.js';
import { fleetOf } from '../test-support/fleet.js';
import { silentLogger } from '../test-support/silent-logger.js';

const service = createAllocationService(silentLogger);

describe('format-report', () => {
  it('explains when both strategies cost the same', () => {
    expect(formatComparison({ baselineCost: 9, optimisedCost: 9, costDifference: 0 })).toContain(
      'Insight: Both strategies cost the same, so using every category added no cost here.',
    );
  });

  it('says when no standby robots are needed', () => {
    const report = service.allocateSingle(
      fleetOf({ Delta: 1 }),
      8,
      Warehouse.unlimited(DEFAULT_CATALOG),
    );

    expect(formatSingleClientReport(report).join('\n')).toContain(
      'No standby robots required: active capacity of 8 hours covers 8 hours.',
    );
  });

  it('notes when the comparison cannot run', () => {
    const report = service.allocateSingle(
      fleetOf({ Delta: 2 }),
      8,
      Warehouse.unlimited(DEFAULT_CATALOG),
    );

    expect(formatSingleClientReport(report).join('\n')).toContain(
      'Comparison skipped: both levels need a valid allocation.',
    );
  });

  it('prints failed clients and n/a utilisation', () => {
    const report = service.allocateMany(fleetOf({}), [5, 3], Warehouse.of(fleetOf({})));
    const text = formatMultiClientReport(report).join('\n');

    expect(text).toContain('Client 1: 5 hours\nError: No robots available for assignment.');
    expect(text).toContain('Clients Served: 0 of 2');
    expect(text).toContain('Avg Robot Utilization: n/a');
    expect(text).toContain('Bravo utilization: n/a');
  });
});
