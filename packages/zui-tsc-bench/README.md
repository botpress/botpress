# @bpinternal/zui-tsc-bench

CI check: type-checks each file in `packages/zui/bench/` in isolation with `tsc --extendedDiagnostics`
and fails if its `Instantiations` count exceeds the threshold set in `instantiation-thresholds.ts`.

Run locally: `pnpm check:instantiations` (rebuild zui first — `pnpm -F @bpinternal/zui build`).
