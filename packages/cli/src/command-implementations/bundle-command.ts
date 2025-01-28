import chalk from 'chalk'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type BundleCommandDefinition = typeof commandDefinitions.bundle
export class BundleCommand extends ProjectCommand<BundleCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()

    const rel = this.projectPaths.rel('workDir')
    const line = this.logger.line()

    if (projectDef.type === 'interface') {
      this.logger.success('Interface projects have no implementation to bundle.')
    } else if (projectDef.type === 'integration') {
      const { name, __advanced } = projectDef.definition
      line.started(`Bundling integration ${chalk.bold(name)}...`)
      await this._bundle(__advanced?.esbuild ?? {})
    } else if (projectDef.type === 'bot') {
      line.started('Bundling bot...')
      await this._bundle()
    } else if (projectDef.type === 'plugin') {
      line.started('Bundling plugin...')
      await this._bundle()
    } else {
      type _assertion = utils.types.AssertNever<typeof projectDef>
      throw new errors.UnsupportedProjectType()
    }

    line.success(`Bundle available at ${chalk.grey(rel.outDir)}`)
  }

  private async _bundle(props: Partial<utils.esbuild.BuildOptions> = {}) {
    const abs = this.projectPaths.abs
    await utils.esbuild.buildCode(
      {
        absWorkingDir: abs.workDir,
        outfile: abs.outFile,
        code: this._code,
      },
      {
        ...this._buildOptions,
        ...props,
      }
    )
  }

  private get _code() {
    const rel = this.projectPaths.rel('workDir')
    const unixPath = utils.path.toUnix(rel.entryPoint)
    const importFrom = utils.path.rmExtension(unixPath)
    return `import x from './${importFrom}'; export default x; export const handler = x.handler;`
  }

  private get _buildOptions(): Partial<utils.esbuild.BuildOptions> {
    return {
      logLevel: this.argv.verbose ? 'info' : 'silent',
      sourcemap: this.argv.sourceMap,
      minify: this.argv.minify,
    }
  }
}
