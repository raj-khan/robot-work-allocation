# Robot Work Allocation

A terminal app for EverBot Solutions that assigns Bravo, Charlie and Delta robots to client work. It covers all four levels of the brief plus the bonus summary and metrics.

## Quick start

Needs Node 22.12+.

```sh
npm ci
npm run dev                       # interactive, prompts like the brief
npm run build && npm start        # compiled
```

Or with Docker:

```sh
docker build -t robot-allocate .
docker run --rm -it robot-allocate                       # interactive
docker run --rm robot-allocate --bravo 2 --charlie 3 --delta 2 --hours 20
```

## Usage

Anything not passed as a flag is prompted for, so these are equivalent:

```sh
printf '2\n3\n2\n20\n' | npm start --silent
npm start --silent -- --bravo 2 --charlie 3 --delta 2 --hours 20
```

| Flag                              | Meaning                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `--bravo`, `--charlie`, `--delta` | Active robots per type                                    |
| `--hours`                         | One client (`20`) or several (`12,16,17` or `"12 16 17"`) |
| `--standby-bravo` etc.            | Standby stock. Unlimited if none are given                |
| `-h`, `--help`                    | Usage                                                     |

**One client** prints Level 1, Level 2, the cost comparison and Level 3:

```
=== Level 1: Category Distribution ===
Robot Assignment
Bravo: 1
Charlie: 2
Delta: 1

Total Work Hours Provided: 21
Client Work Hours Requested: 20
Total Charging Cost: $12

=== Level 2: Cost Optimised ===
Cost Optimized Allocation
Charlie: 1
Delta: 2

Total Hours Provided: 21
Total Charging Cost: $11

=== Level 1 vs Level 2 Comparison ===
Level 1 Cost: $12
Level 2 Cost: $11
Cost Difference: $1

Insight: Level 1 strategy resulted in $1 additional cost due to mandatory usage of multiple robot categories.

=== Level 3: Standby Robot Activation ===
No standby robots required: active capacity of 37 hours covers 20 hours.
```

**Several clients** (`--hours "12,16,17,10,21"`) prints Level 4: each client in priority order, then the summary and per-type utilisation.

Bad input prints the brief's error to stderr and exits with code 1. Set `LOG_LEVEL=info` (or `debug`) to see JSON logs on stderr.

## How each level decides

| Level | Rule                                                                                                     | Tie-break                      |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1     | One robot of every type, then top up with the least excess hours                                         | Cheaper, then fewer robots     |
| 2     | Lowest charging cost                                                                                     | Less excess, then fewer robots |
| 3     | If active capacity is short, use all active robots and cover the shortfall with the cheapest standby mix | Same as Level 2                |
| 4     | Clients served by highest hours first from one shared pool. Each client runs Level 3 on what is left     | Equal hours keep input order   |

All four levels share one optimiser: a bounded knapsack over hours that works for any robot catalog. Each strategy supplies a ranking (`CHEAPEST` or `LEAST_EXCESS`), so the tie-breaks above are explicit and tested.

## Design

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

Main choices:

- **Robot types are data.** `RobotCatalog` is the only place Bravo, Charlie and Delta exist. Add an `Echo` robot there and the optimiser, strategies and CLI flags (`--echo`, `--standby-echo`) pick it up. A test proves the optimiser handles a type it has never seen (Open/Closed).
- **Strategy pattern.** Level 1 and Level 2 implement `AllocationStrategy`. Level 3 takes a strategy by injection, and Level 4 takes Level 3. `createAllocationService` is the single composition root.
- **Immutable value objects.** `Fleet` and `Allocation` never change after creation, so Level 4 clients can share a pool safely.
- **Errors as values.** Expected failures return `Result<T, AllocationError>` with the brief's exact messages. Exceptions are reserved for bugs.
- **Validate at the edge.** zod checks argv, prompts and env once; the domain only sees typed values.
- **Pure core, thin shell.** Only `src/cli` touches stdin, stdout and argv. Logs go to stderr so the report can be piped.

## Assumptions

- **Level 1** needs at least one robot of every type. It fails with the brief's "Unable to allocate at least one robot from each category" message if any type has none.
- **Level 2, example 2** is a tie: Bravo 2 and Delta 1 both cost $4. I break ties on less excess, which gives the expected Bravo 2.
- **Standby stock** is unlimited unless `--standby-*` flags are given, because the brief never sizes the warehouse.
- **Level 3** uses every active robot before activating standby, matching the brief's example (16h active + Charlie 1 for 21h).
- **Level 4** uses the cost-optimised rule for each client. A client that can't be served is reported and the rest carry on.
- **Utilisation** isn't defined in the brief. Average utilisation is requested hours over provided hours. Per-type utilisation is the share of the active fleet that got used.
- Hours are capped at 100,000 per client so a typo can't stall the optimiser.

## Trade-offs

- **Level 3 is not always the global minimum.** Using every active robot first can cost more than idling one and activating a better standby robot. For example, 17h against Bravo 2 + Charlie 2 costs $12 my way and $11 in theory. I followed the brief's example. Optimising globally would be a small change to Level 3.
- **Knapsack vs greedy.** Greedy is shorter but wrong on cases like 6h (picks Delta 1, $4 with 2h of waste). The knapsack runs in O(types × log n × hours) and handles 100k hours in about half a second.
- **Fail fast on bad input** instead of re-prompting, so piped and scripted use stays predictable.

## Testing

```sh
npm run check        # typecheck, lint, format, tests with coverage (same as CI)
npm run test:watch
```

- Written test-first. Every example in the brief is a test, word for word.
- fast-check property tests compare the optimiser against a brute-force oracle across hundreds of random fleets, and check that Level 2 never costs more than Level 1.
- 140+ tests, 100% statement coverage, enforced thresholds in CI.

## Engineering workflow

- One [Backlog.md](backlog/tasks) task per PR, stacked in order (#1 to #11).
- Husky hooks: lint-staged on commit, commit-message format check, typecheck and tests on push.
- CI runs `npm run check`, builds, then builds and smoke-tests the Docker image.
- [AGENTS.md](AGENTS.md) holds the shared rules for humans and AI agents. `.claude/` has the team settings and a reviewer agent.

## With more time

- A `--strategy` flag to run one level, and JSON output for other tools.
- Load the robot catalog from a config file.
- An optional global-optimum mode for Level 3/4 alongside the brief's rule.
- Mutation testing (Stryker) to check that the tests catch real faults.

## More

- [Thought process](docs/thought-process.md): how I approached it and why
- [AI usage](docs/ai-usage.md): the disclosure the brief asks for
