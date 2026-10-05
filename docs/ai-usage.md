# AI usage

## Which tools

Claude Code (Claude Opus 5.5) in the terminal.

## How I used it

As a pair programmer, inside guardrails I set up first:

- `AGENTS.md` sets the rules: layer boundaries, test-first, commit style.
- Hooks and CI enforce them: strict TypeScript, type-aware ESLint, coverage thresholds, commit-message checks.
- Backlog.md tasks keep each session scoped to one PR.

Per task: agree on the behaviour, write failing tests, watch them fail, implement, run `npm run check`, review the diff, commit in small steps.

## What was AI-assisted

- Surveying existing public solutions and summarising their gaps.
- Drafting most of the code and tests to my direction, then iterating on the design with me (catalog as data, knapsack optimiser, Result type, standby warehouse).
- Tooling config (ESLint, Vitest, Husky, CI, Docker).
- First drafts of these docs.

I own every decision and reviewed every line, especially the assumptions, the tie-break rules against the brief's examples, and the Level 3 trade-off.

## Workflow worth sharing

- Make the AI prove correctness, not claim it. The brute-force oracle and property tests mean I don't have to trust the optimiser.
- Give the agent the same guardrails as a new teammate. The commit hook rejects the agent's bad messages just as it would mine.
- Keep tasks small. One backlog task per session gives focused diffs and easy reviews.
