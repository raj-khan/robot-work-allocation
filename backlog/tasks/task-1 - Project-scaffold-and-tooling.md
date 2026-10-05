---
id: TASK-1
title: Project scaffold and tooling
status: Done
assignee: []
created_date: '2026-10-05 11:14'
updated_date: '2026-10-05 11:16'
labels:
  - setup
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Strict TypeScript, ESLint, Prettier, Vitest, git hooks, CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 npm run check passes on an empty project
- [x] #2 Pre-commit lints staged files, commit-msg enforces message format
- [x] #3 CI runs lint, typecheck, tests with coverage
<!-- AC:END -->
