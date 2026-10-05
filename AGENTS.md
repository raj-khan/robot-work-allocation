# AGENTS.md

Guidance for anyone, human or AI agent, working in this repo. This file is the source of truth; `CLAUDE.md` points here.

## What this is

A terminal app that assigns EverBot robots (Bravo, Charlie, Delta) to client work requests. Four levels of strategy plus bonus reporting. See `README.md` for the product view and `docs/` for design decisions.

## Commands

| Task                   | Command              |
| ---------------------- | -------------------- |
| Install                | `npm ci`             |
| Run (dev)              | `npm run dev`        |
| Full gate (same as CI) | `npm run check`      |
| Tests in watch mode    | `npm run test:watch` |
| Build                  | `npm run build`      |

Run `npm run check` before opening a PR. It must pass.

## Architecture rules

- `src/domain` is pure: no I/O, no logger, no `process`. It only depends on `src/shared`.
- `src/application` orchestrates domain objects and may take a logger by injection.
- `src/cli` is the only layer that touches stdin, stdout, argv and env.
- Robot types live in one catalog. Adding a type must not need algorithm changes.
- Validate untrusted input with zod at the edge, then work with typed values.
- Expected failures return `Result`; throw only for programmer errors.

## Code style

- Strict TypeScript. No `any`, no non-null assertions outside tests.
- Small classes and functions with one job. Inject dependencies through constructors.
- Comments are one short sentence, only when the why is not obvious from the code.
- No em-dashes in prose, comments or output text.

## Testing

- Write the test first, watch it fail, then make it pass.
- Tests sit next to the code as `*.test.ts`.
- Spec examples from the brief must exist as tests word for word.
- Optimisation code needs property tests against a brute-force oracle.

## Workflow

- One backlog task per branch and PR: `task-<id>/<short-name>`.
- Track work with Backlog.md: `backlog task list --plain`, `backlog task edit <id> -s "In Progress"`.
- Commits are small and focused. Subject: `<Verb> <summary>`, verbs `Add|Fix|Update|Remove|Refactor|Test|Docs|Chore`, 72 chars max. The commit-msg hook enforces it.
- Stage files by name. Never commit `.env`, `dist/`, `coverage/` or `node_modules/`.
- No AI co-author trailers or signatures in commits or PRs.
