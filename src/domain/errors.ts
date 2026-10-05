const MESSAGES = {
  INSUFFICIENT_CAPACITY: 'Insufficient robot capacity to complete the requested work.',
  CATEGORY_DISTRIBUTION_IMPOSSIBLE:
    'Unable to allocate at least one robot from each category with the available inventory.',
  NO_ROBOTS: 'No robots available for assignment.',
  INVALID_WORK_HOURS: 'Work hours must be a positive integer.',
  INVALID_ROBOT_COUNT: 'Robot counts must be non-negative integers.',
  UNKNOWN_ROBOT_TYPE: 'Unknown robot type',
  WORK_HOURS_TOO_LARGE: 'Work hours are above the supported maximum',
} as const;

export type AllocationErrorCode = keyof typeof MESSAGES;

// Expected business failures; returned in a Result rather than thrown.
export class AllocationError extends Error {
  override readonly name = 'AllocationError';

  constructor(
    readonly code: AllocationErrorCode,
    detail?: string,
  ) {
    super(detail === undefined ? MESSAGES[code] : `${MESSAGES[code]}: ${detail}.`);
  }
}
