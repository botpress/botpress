# @bpinternal/tsc-bench

Measures the TypeScript instantiation cost of a source file. `lib.ts` exports
`measureCase(caseName, sourceCode)`, which type-checks the given source in isolation with
`tsc --extendedDiagnostics` and returns its `Instantiations`/`Types`/etc. metrics.

`measure-case.ts` is a CLI wrapper around it: `<caseName>` as an argument, source read from stdin,
result printed as JSON. It's meant to be invoked as a subprocess (e.g. by
`packages/zui/bench/check-instantiations.mts`) rather than imported as a module, since a caller may
be an ESM package while this one is CommonJS.
