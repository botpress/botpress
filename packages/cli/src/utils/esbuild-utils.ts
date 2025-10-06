import * as esb from 'esbuild'
import _ from 'lodash'

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

export abstract class BuildContext<T> {
  private _context: esb.BuildContext | undefined
  private _previousProps: T | undefined
  private _previousOpts: esb.BuildOptions = {}

  protected abstract _createContext(props: T, opts: esb.BuildOptions): Promise<esb.BuildContext>

  public async rebuild(props: T, opts: esb.BuildOptions = {}) {
    if (!this._context || !_.isEqual(props, this._previousProps) || !_.isEqual(opts, this._previousOpts)) {
      if (this._context) {
        await this._context.dispose()
      }
      this._context = await this._createContext(props, opts)
      this._previousOpts = opts
      this._previousProps = props
    }
    return await this._context?.rebuild()
  }
}

export class BuildCodeContext extends BuildContext<BuildCodeProps> {
  protected _createContext(props: BuildCodeProps, opts: esb.BuildOptions = {}): Promise<esb.BuildContext> {
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
}

export class BuildEntrypointContext extends BuildContext<BuildEntrypointProps> {
  protected _createContext(props: BuildEntrypointProps, opts: esb.BuildOptions = {}): Promise<esb.BuildContext> {
    const { absWorkingDir, entrypoint } = props
    return esb.context({
      ...DEFAULT_OPTIONS,
      ...opts,
      absWorkingDir,
      entryPoints: [entrypoint],
      outfile: undefined,
      write: false,
    })
  }
}

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
