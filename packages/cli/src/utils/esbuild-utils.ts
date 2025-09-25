import * as esb from 'esbuild'
import { isEqual } from 'lodash'

export * from 'esbuild'

type BaseProps = {
  absWorkingDir: string
}

export type BuildCodeProps = BaseProps & {
  code: string
  outfile: string
}

export type BuildEntrypointProps = BaseProps & {
  entrypoint: string
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
  minify: false,
}

class IncrementalBuildContext {
  private _context: esb.BuildContext | undefined
  private _previousProps: BuildCodeProps | undefined
  private _previousOpts: esb.BuildOptions = {}

  private _createContext(props: BuildCodeProps, opts: esb.BuildOptions = {}): Promise<esb.BuildContext> {
    const { absWorkingDir, code, outfile } = props
    return esb.context({
      ...DEFAULT_OPTIONS,
      ...opts,
      absWorkingDir,
      outfile,
      stdin: { contents: code, resolveDir: absWorkingDir, loader: 'ts' },
      write: true,
    })
  }

  public async rebuild(props: BuildCodeProps, opts: esb.BuildOptions = {}) {
    if (!this._context || !isEqual(props, this._previousProps) || !isEqual(opts, this._previousOpts)) {
      if (this._context) {
        await this._context.dispose()
      }
      this._context = await this._createContext(props, opts)
      this._previousOpts = opts
      this._previousProps = props
    }
    await this._context?.rebuild()
  }
}

export const context = new IncrementalBuildContext()

/**
 * Bundles a string of typescript code and writes the output to a file
 */
export function buildCode(props: BuildCodeProps, opts: esb.BuildOptions = {}): Promise<esb.BuildResult> {
  const { absWorkingDir, code, outfile } = props
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...opts,
    absWorkingDir,
    outfile,
    stdin: { contents: code, resolveDir: absWorkingDir, loader: 'ts' },
    write: true,
  })
}

/**
 * Bundles a typescript file and returns the output as a string
 */
export function buildEntrypoint(
  props: BuildEntrypointProps,
  opts: esb.BuildOptions = {}
): Promise<esb.BuildResult & { outputFiles: esb.OutputFile[] }> {
  const { absWorkingDir, entrypoint } = props
  return esb.build({
    ...DEFAULT_OPTIONS,
    ...opts,
    absWorkingDir,
    entryPoints: [entrypoint],
    outfile: undefined,
    write: false,
  })
}
