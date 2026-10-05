import { describe, expect, it, vi } from 'vitest';

import { createAllocationService } from './allocation-service.js';
import { DEFAULT_CATALOG } from '../domain/robot-catalog.js';
import { Warehouse } from '../domain/standby/warehouse.js';
import { fleetOf } from '../test-support/fleet.js';
import { silentLogger } from '../test-support/silent-logger.js';

const unlimited = Warehouse.unlimited(DEFAULT_CATALOG);

describe('AllocationService', () => {
  it('runs Levels 1 to 3 for one client and compares costs', () => {
    const service = createAllocationService(silentLogger);

    const report = service.allocateSingle(
      fleetOf({ Bravo: 2, Charlie: 3, Delta: 2 }),
      20,
      unlimited,
    );

    expect(report.categoryDistribution.ok && report.categoryDistribution.value.cost).toBe(12);
    expect(report.costOptimised.ok && report.costOptimised.value.cost).toBe(11);
    expect(report.comparison?.costDifference).toBe(1);
    expect(report.standby.ok && report.standby.value.needsStandby).toBe(false);
  });

  it('skips the comparison when a level fails', () => {
    const service = createAllocationService(silentLogger);

    const report = service.allocateSingle(fleetOf({ Delta: 2 }), 10, unlimited);

    expect(report.categoryDistribution.ok).toBe(false);
    expect(report.comparison).toBeUndefined();
  });

  it('runs Level 4 and summarises for several clients', () => {
    const service = createAllocationService(silentLogger);

    const report = service.allocateMany(fleetOf({ Delta: 2 }), [16, 10], unlimited);

    expect(report.run.outcomes).toHaveLength(2);
    expect(report.summary.totalChargingCost).toBe(14);
  });

  it('logs each run', () => {
    const logger = { ...silentLogger, info: vi.fn() };
    const service = createAllocationService(logger);

    service.allocateSingle(fleetOf({ Delta: 1 }), 8, unlimited);
    service.allocateMany(fleetOf({ Delta: 1 }), [8, 3], unlimited);

    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});
