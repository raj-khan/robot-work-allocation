# Thought process

## Picking the challenge

I picked Robot Work Allocation over Passenger Resource Management. The robot brief gives exact inputs, outputs and error messages, so every example becomes a test, and the core is a real optimisation problem. The passenger brief would mean inventing most requirements, so reviewers would judge my assumptions more than my code.

## Looking at what exists

Before coding I searched GitHub for public solutions to this brief and found about ten (TypeScript, Python, Dart). None has a licence, so I used them as research only and reused no code. They showed where the bar is:

- Most hardcode the three robot types in nested loops. Adding a type means rewriting the algorithm.
- Tie-breaking is implicit, so Level 2 example 2 (Bravo 2 vs Delta 1, both $4) passes or fails by accident of loop order.
- Optimality is checked with a handful of examples, not proven.

So my goals were: robot types as data, one generic optimiser, explicit tie-break rules, and property tests against brute force.

## Breaking it down

I split the work into 11 Backlog.md tasks, one PR each, in dependency order: tooling, agent rules, domain model, optimiser, then each level, then reporting, CLI, Docker and docs. Each PR stacks on the previous one, so reading them in order tells the story.

## Key decisions

1. **One optimiser, many objectives.** Every level is "choose robot counts to cover N hours, ranked somehow". A bounded knapsack finds the best set for each exact hour total, and the strategy's ranking picks among them. Level 1 is "reserve one of each, then least excess". Level 2 is "cheapest". Level 3 runs Level 2 on the shortfall. Level 4 runs Level 3 per client.
2. **Prove it, don't just test it.** A brute-force oracle tries every combination on small fleets. fast-check runs hundreds of random fleets through both and asserts they agree.
3. **Spec ties are real.** Two brief examples only pass with the right tie-break: Level 2's 6h (prefer less excess) and Level 1's 24h (prefer cheaper). I made both explicit in the objectives.
4. **Keep I/O at the edge.** The domain has no `console`, no `process` and no logger. The CLI validates input with zod, calls one service and formats the result. So almost every test is fast and mock-free.
5. **Follow the brief where it is specific, document where it is not.** The README lists my choices for standby stock size, utilisation and the Level 3 rule.

## Things that surprised me

- TypeScript 7 is out, but typescript-eslint supports only up to 6.0, so I pinned 6.0 to keep type-aware linting.
- The literal Level 3 rule (use all active robots, then standby) is not always globally cheapest. I kept the brief's behaviour and listed the alternative as a trade-off rather than quietly changing the spec.
