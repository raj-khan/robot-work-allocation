# Robot Work Allocation

Terminal app that assigns Bravo, Charlie and Delta robots to client work. Covers Levels 1 to 4 and the bonus summary and metrics. TypeScript, Node 22.12+.

## Run

```sh
npm ci && npm run dev                                       # prompts like the brief
npm run dev -- --bravo 2 --charlie 3 --delta 2 --hours 20   # one client: Levels 1, 2, comparison, 3
npm run dev -- --bravo 2 --charlie 3 --delta 2 --hours "12,16,17,10,21"   # several: Level 4 + summary
docker build -t robot-allocate . && docker run --rm -it robot-allocate
npm run check                                               # typecheck, lint, tests + coverage (CI)
```

Optional: `--standby-bravo` etc. for finite standby stock, `LOG_LEVEL=info` for JSON logs on stderr, `--help`.

## How each level decides

| Level | Rule                                                                             | Tie-break                      |
| ----- | -------------------------------------------------------------------------------- | ------------------------------ |
| 1     | One of every type, then least excess hours                                       | Cheaper, then fewer robots     |
| 2     | Lowest charging cost                                                             | Less excess, then fewer robots |
| 3     | If active capacity is short, use all active robots plus the cheapest standby mix | Same as Level 2                |
| 4     | Highest hours first from one shared pool, Level 3 per client                     | Input order                    |

## Assumptions and trade-offs

- Level 2 example 2 is a $4 tie (Bravo 2 vs Delta 1); less excess picks Bravo 2, as expected.
- Standby stock is unlimited unless given, since the brief never sizes it.
- Utilisation: requested over provided hours overall; share of active fleet used per type.
- Hours are capped at 100,000 per client.
- Level 3 follows the brief's example (all active first). It is not always the global minimum: 17h against Bravo 2 + Charlie 2 costs $12 this way, $11 at best.

## More

[Design](docs/design.md) · [Thought process](docs/thought-process.md) · [AI usage](docs/ai-usage.md)
