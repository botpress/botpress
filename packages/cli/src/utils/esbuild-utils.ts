import * as esb from 'esbuild'

export * from 'esbuild'

type BaseProps = esb.BuildOptions & {
  absWorkingDir: string
}

export type BuildCodeProps = BaseProps & {
  code: string
  write: true
  outfile: string
}

export type BuildEntrypointProps = BaseProps & {
  entrypoint: string
  write: false
}

const DEFAULT_OPTIONS: esb.BuildOptions = {
  bundle: true,
  sourcemap: false,
  logLevel: 'silent',
  platform: 'node',
  target: 'es2020',
  legalComments: 'none',
  logOverride: { 'equals-negative-zero': 'silent' },
  keepNames: true, // important : https://github.com/node-fetch/node-fetch/issues/784#issuecomment-1014768204
}

/**
 * Bundles a string of typescript code and writes the output to a file
 */
export function buildCode(p: BuildCodeProps): Promise<esb.BuildResult> {
  const { code, ...props } = p
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...props,
    stdin: {
      contents: code,
      resolveDir: props.absWorkingDir,
      loader: 'ts',
    },
  })
}

/**
 * Bundles a typescript file and returns the output as a string
 */
export function buildEntrypoint(p: BuildEntrypointProps): Promise<esb.BuildResult & { outputFiles: esb.OutputFile[] }> {
  const { entrypoint, ...props } = p
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...props,
    outfile: undefined,
    entryPoints: [entrypoint],
  })
}
