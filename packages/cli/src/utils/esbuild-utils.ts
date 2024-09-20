import { build as esbuild, LogLevel, BuildResult, OutputFile } from 'esbuild'

type BaseProps<W extends boolean> = {
  cwd: string
  outfile: string
  minify?: boolean
  sourcemap?: boolean
  bundle?: boolean
  logLevel?: LogLevel
  write: W
}

export type BuildCodeProps<W extends boolean> = BaseProps<W> & {
  code: string
}

export type BuildEntrypointProps<W extends boolean> = BaseProps<W> & {
  entrypoint: string
}

const keepNames = true // important : https://github.com/node-fetch/node-fetch/issues/784#issuecomment-1014768204

export function buildCode(p: BuildCodeProps<true>): Promise<BuildResult>
export function buildCode(p: BuildCodeProps<false>): Promise<BuildResult & { outputFiles: OutputFile[] }>
export function buildCode<W extends boolean>({
  cwd,
  minify = true,
  bundle = true,
  sourcemap = false,
  logLevel = 'silent',
  outfile,
  code,
  write,
}: BuildCodeProps<W>) {
  return esbuild({
    stdin: {
      contents: code,
      resolveDir: cwd,
      loader: 'ts',
    },
    logOverride: {
      'equals-negative-zero': 'silent',
    },
    platform: 'node',
    target: 'es2020',
    sourcemap,
    minify,
    bundle,
    outfile,
    absWorkingDir: cwd,
    logLevel,
    keepNames,
    write,
    legalComments: 'none',
  })
}

export function buildEntrypoint(p: BuildEntrypointProps<true>): Promise<BuildResult>
export function buildEntrypoint(p: BuildEntrypointProps<false>): Promise<BuildResult & { outputFiles: OutputFile[] }>
export function buildEntrypoint<W extends boolean>({
  cwd,
  minify = true,
  bundle = true,
  sourcemap = false,
  logLevel = 'silent',
  outfile,
  entrypoint,
  write,
}: BuildEntrypointProps<W>) {
  return esbuild({
    entryPoints: [entrypoint],
    logOverride: {
      'equals-negative-zero': 'silent',
    },
    platform: 'node',
    target: 'es2020',
    sourcemap,
    minify,
    bundle,
    outfile,
    absWorkingDir: cwd,
    logLevel,
    keepNames,
    write,
  })
}
