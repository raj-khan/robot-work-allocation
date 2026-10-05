---
id: TASK-3
title: Domain model
status: Done
assignee: []
created_date: '2026-10-05 11:14'
updated_date: '2026-10-05 11:19'
labels:
  - domain
dependencies:
  - TASK-1
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Robot catalog, fleet, allocation, Result type and domain errors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Robot catalog is data driven and validated with zod
- [x] #2 Fleet is immutable and rejects negative or non-integer counts
- [x] #3 Errors carry the exact messages from the spec
<!-- AC:END -->
