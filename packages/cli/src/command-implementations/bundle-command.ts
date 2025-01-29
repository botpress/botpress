import chalk from 'chalk'
import { SingleLineLogger } from 'src/logger'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type BundleCommandDefinition = typeof commandDefinitions.bundle
export class BundleCommand extends ProjectCommand<BundleCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()

    if (projectDef.type === 'interface') {
      this.logger.success('Interface projects have no implementation to bundle.')
      return
    }

    const line = this.logger.line()

    if (projectDef.type === 'integration') {
      const { name, __advanced } = projectDef.definition
      line.started(`Bundling integration ${chalk.bold(name)}...`)
      return await this._bundle(line, __advanced?.esbuild ?? {})
    }

    if (projectDef.type === 'bot') {
      line.started('Bundling bot...')
      return await this._bundle(line)
    }

    if (projectDef.type === 'plugin') {
      line.started('Bundling plugin...')
      return await this._bundle(line)
    }

    throw new errors.UnsupportedProjectType()
  }

  private async _bundle(line: SingleLineLogger, props: Partial<utils.esbuild.BuildOptions> = {}) {
    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')

    const unixPath = utils.path.toUnix(rel.entryPoint)
    const importFrom = utils.path.rmExtension(unixPath)
    const code = `import x from './${importFrom}'; export default x; export const handler = x.handler;`

    line.debug(`Writing bundle to ${abs.outFile}`)

    const buildOptions: Partial<utils.esbuild.BuildOptions> = {
      logLevel: this.argv.verbose ? 'info' : 'silent',
      sourcemap: this.argv.sourceMap,
      minify: this.argv.minify,
      ...props,
    }

    await utils.esbuild.buildCode({
      ...buildOptions,
      absWorkingDir: abs.workDir,
      outfile: abs.outFile,
      write: true,
      code,
    })

    line.success(`Bundle available at ${chalk.grey(rel.outDir)}`)
  }
}
