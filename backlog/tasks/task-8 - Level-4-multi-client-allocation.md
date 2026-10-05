---
id: TASK-8
title: Level 4 multi-client allocation
status: To Do
assignee: []
created_date: '2026-10-05 11:14'
labels:
  - level-4
dependencies:
  - TASK-7
priority: high
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Parse single, comma or space separated hours and serve clients by highest hours first.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three input forms parse to the same clients
- [ ] #2 Active pool is shared and consumed across clients
- [ ] #3 Standby robots listed when active pool runs out
<!-- AC:END -->
