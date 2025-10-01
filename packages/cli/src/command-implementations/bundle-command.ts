import chalk from 'chalk'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type BundleCommandDefinition = typeof commandDefinitions.bundle
export class BundleCommand extends ProjectCommand<BundleCommandDefinition> {
  public async run(buildContext?: utils.esbuild.IncrementalBuildContext): Promise<void> {
    const { projectType, resolveProjectDefinition } = this.readProjectDefinitionFromFS()

    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')
    const line = this.logger.line()

    if (projectType === 'interface') {
      this.logger.success('Interface projects have no implementation to bundle.')
    } else if (projectType === 'integration') {
      const projectDef = await resolveProjectDefinition()
      const { name, __advanced } = projectDef.definition
      line.started(`Bundling integration ${chalk.bold(name)}...`)
      await this._bundle(abs.outFileCJS, buildContext, __advanced?.esbuild ?? {})
    } else if (projectType === 'bot') {
      line.started('Bundling bot...')
      await this._bundle(abs.outFileCJS, buildContext)
    } else if (projectType === 'plugin') {
      line.started('Bundling plugin with platform node...')
      await this._bundle(abs.outFileCJS, buildContext)

      line.started('Bundling plugin with platform browser...')
      await this._bundle(abs.outFileESM, buildContext, { platform: 'browser', format: 'esm' })
    } else {
      throw new errors.UnsupportedProjectType()
    }

    line.success(`Bundle available at ${chalk.grey(rel.outDir)}`)
  }

  private async _bundle(
    outfile: string,
    buildContext?: utils.esbuild.IncrementalBuildContext,
    props: Partial<utils.esbuild.BuildOptions> = {}
  ) {
    const abs = this.projectPaths.abs
    const context = buildContext ?? new utils.esbuild.IncrementalBuildContext()
    await context.rebuild(
      {
        outfile,
        absWorkingDir: abs.workDir,
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
