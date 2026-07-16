# @bpinternal/tsc-bench

Measures the TypeScript instantiation cost of a source file. `lib.ts` exports
`measureCase(caseName, sourceCode, paths?)`, which type-checks the given source in isolation with
`tsc --extendedDiagnostics` and returns its `Instantiations`/`Types`/etc. metrics.

`paths` is an optional `{ moduleSpecifier: absoluteFilePath }` map, written into the generated
case's `tsconfig.json` as `compilerOptions.paths`. It lets a caller redirect any import straight to
a file on disk, bypassing `node_modules` resolution entirely — which is how this package stays
unaware of what it's measuring: it never needs the tested code's own dependencies installed here.

`measure-case.ts` is a CLI wrapper around it: `<caseName>` and an optional JSON `paths` map as
arguments, source read from stdin, result printed as JSON. It's meant to be invoked as a subprocess
(e.g. by `packages/zui/bench/check-instantiations.mts`) rather than imported as a module, since a
caller may be an ESM package while this one is CommonJS.
