---
id: TASK-4
title: Generic fleet optimiser
status: Done
assignee: []
created_date: '2026-10-05 11:14'
updated_date: '2026-10-05 11:21'
labels:
  - domain
dependencies:
  - TASK-3
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bounded knapsack over any robot catalog, ranked by a pluggable objective.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Works for any number of robot types
- [x] #2 Property tests prove it matches brute force
- [x] #3 Deterministic tie-breaking
<!-- AC:END -->
