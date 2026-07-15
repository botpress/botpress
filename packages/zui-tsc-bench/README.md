# @bpinternal/zui-tsc-bench

Measures the TypeScript compile-time cost (type instantiations) of common zui schema patterns,
to catch instantiation-count regressions before they ship.

Each scenario is generated into `cases/` and type-checked as an isolated `tsc --noEmit
--extendedDiagnostics` program against zui's built declarations (`dist/index.d.ts`, i.e. what
consumers actually type-check against) — rebuild zui first (`pnpm -F @bpinternal/zui build`).

## Scenarios

| Scenario                  | What it models                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `control`                 | Fixed import cost: one 2-key object + infer. Read chain scenarios as deltas over this.     |
| `extend-chain-10` / `-25` | `.extend()` chained N deep, 5 new keys per level — the classic v3 instantiation blowup     |
| `pick-omit-chain-10`      | Alternating `.extend()` / `.pick()` / `.omit()` rounds on a 20-key object                  |
| `many-objects-50`         | 50 independent 10-key objects, one `.extend()` each — models a large schema-heavy codebase |
| `real-whatsapp`           | A real production schema file (whatsapp integration)                                       |

## CI check: `pnpm check:instantiations`

`check-instantiations.ts` measures zui's `Instantiations` count for each scenario and compares it to
`instantiation-thresholds.json` — a ceiling you set and maintain by hand for each scenario. CI (see
`.github/workflows/run-zui-bench.yml`) fails only when a scenario goes **over** its threshold; small
fluctuations under the cap are fine and don't require touching anything.

There's no auto-generated baseline for this file — if a change legitimately moves the numbers (better
or worse), open `instantiation-thresholds.json` and set the new ceiling yourself, so the change is
visible and intentional in the PR diff.

## Files

- `lib.ts` — shared engine: scenario generation + the `tsc --extendedDiagnostics` runner.
- `check-instantiations.ts` — the CI gate described above.
