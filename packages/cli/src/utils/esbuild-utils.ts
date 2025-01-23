import * as esb from 'esbuild'

type BaseProps<W extends boolean> = esb.BuildOptions & {
  absWorkingDir: string
  outfile: string
  write: W
}

export type BuildCodeProps<W extends boolean = true> = BaseProps<W> & {
  code: string
}

export type BuildEntrypointProps<W extends boolean = true> = BaseProps<W> & {
  entrypoint: string
}

const DEFAULT_OPTIONS: esb.BuildOptions = {
  minify: true,
  bundle: true,
  sourcemap: false,
  logLevel: 'silent',
  platform: 'node',
  target: 'es2020',
  legalComments: 'none',
  logOverride: { 'equals-negative-zero': 'silent' },
  keepNames: true, // important : https://github.com/node-fetch/node-fetch/issues/784#issuecomment-1014768204
}

export function buildCode(p: BuildCodeProps<true>): Promise<esb.BuildResult>
export function buildCode(p: BuildCodeProps<false>): Promise<esb.BuildResult & { outputFiles: esb.OutputFile[] }>
export function buildCode<W extends boolean>(p: BuildCodeProps<W>) {
  const { code, absWorkingDir } = p
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...p,
    stdin: {
      contents: code,
      resolveDir: absWorkingDir,
      loader: 'ts',
    },
  })
}

export function buildEntrypoint(p: BuildEntrypointProps<true>): Promise<esb.BuildResult>
export function buildEntrypoint(p: BuildEntrypointProps<false>): Promise<esb.BuildResult & { outputFiles: esb.OutputFile[] }>
export function buildEntrypoint<W extends boolean>(p: BuildEntrypointProps<W>) {
  const { entrypoint } = p
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...p,
    entryPoints: [entrypoint],
  })
}
