# AI usage

## Which tools

Claude Code (Claude Opus 5.5) in the terminal.

## How I used them

I treated Claude Code as a pair programmer and set the direction and guardrails myself:

- I chose this challenge over Passenger Resource Management, picked the stack (TypeScript, zod, pino, Vitest, Docker) and asked for SOLID, TDD, strict typing and small PRs.
- I asked it to find existing public solutions first, so we could see the common gaps and aim higher.
- Work ran through Backlog.md: one task, one branch, one PR, with `AGENTS.md`, git hooks and CI enforcing the rules on the agent as well as on me.
- Per task: failing tests first, then the implementation, then `npm run check`, then small commits.
- I reviewed the PRs and merged them in order.

## What was AI-assisted

Most of it. Claude Code wrote the bulk of the code, tests, tooling config and docs. I directed it and made or approved the decisions: catalog as data, the knapsack optimiser, tie-break rules, standby assumptions and the Level 3 trade-off. I'm responsible for all of it and can walk through any line.

## Workflow worth sharing

- Make the AI prove correctness, not claim it. A brute-force oracle and property tests check the optimiser.
- Give the agent the same guardrails as a teammate. The commit hook rejects the agent's bad messages just as it would mine.
- Keep tasks small. One backlog task per PR gives focused diffs and easy reviews.

My opening prompt, roughly: "Go with robot, use TypeScript, follow industry standard. Check GitHub for existing solutions and do better. Private repo, Backlog.md tasks, PR by PR. SOLID, TDD, hooks, team Claude config, AGENTS.md, README, thought-process doc, .gitignore, zod, pino, pipe, strict TypeScript, lint, Docker, short human comments."
