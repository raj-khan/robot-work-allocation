# Design

## Layout

```
src/
  domain/        pure logic, no I/O
    robot-catalog, fleet, allocation, errors    value objects
    optimiser/                                  knapsack + ranking objectives
    strategies/                                 Level 1 and Level 2 (AllocationStrategy)
    standby/                                    Level 3 and the warehouse
    multi-client/                               Level 4
    reporting/                                  summary and metrics
  application/   AllocationService, the use cases and wiring
  cli/           args, prompts, zod input parsing, output formatting
  config/        env (zod) and pino logger
  shared/        Result, pipe, Logger port
```

## Main choices

- **Robot types are data.** `RobotCatalog` is the only place Bravo, Charlie and Delta exist. Add an `Echo` robot there and the optimiser, strategies and CLI flags (`--echo`, `--standby-echo`) pick it up. A test proves the optimiser handles a type it has never seen (Open/Closed).
- **One optimiser.** A bounded knapsack over hours, O(types × log n × hours), solves 100k hours in about half a second. Each strategy supplies a ranking (`CHEAPEST` or `LEAST_EXCESS`), so tie-breaks are explicit and tested. Greedy is shorter but wrong on cases like 6h.
- **Strategy pattern.** Level 1 and Level 2 implement `AllocationStrategy`. Level 3 takes a strategy by injection, and Level 4 takes Level 3. `createAllocationService` is the single composition root.
- **Immutable value objects.** `Fleet` and `Allocation` never change after creation, so Level 4 clients can share a pool safely.
- **Errors as values.** Expected failures return `Result<T, AllocationError>` with the brief's exact messages. Exceptions are reserved for bugs.
- **Validate at the edge.** zod checks argv, prompts and env once; the domain only sees typed values. Bad input fails fast instead of re-prompting, so piped use stays predictable.
- **Pure core, thin shell.** Only `src/cli` touches stdin, stdout and argv. pino logs go to stderr so the report can be piped.

## Testing

- Written test-first. Every example in the brief is a test, word for word.
- fast-check property tests compare the optimiser against a brute-force oracle, and check that Level 2 never costs more than Level 1.
- 140+ tests, 100% statement coverage, thresholds enforced in CI.

## Workflow

- One [Backlog.md](../backlog/tasks) task per PR (#1 to #11), merged in order.
- Husky hooks: lint-staged on commit, commit-message check, typecheck and tests on push.
- CI runs `npm run check`, builds, then builds and smoke-tests the Docker image.
- [AGENTS.md](../AGENTS.md) holds the shared rules for humans and AI agents. `.claude/` has team settings and a reviewer agent.

## With more time

- A `--strategy` flag to run one level, and JSON output.
- Load the robot catalog from a config file.
- An optional global-optimum mode for Level 3/4.
- Mutation testing (Stryker).
