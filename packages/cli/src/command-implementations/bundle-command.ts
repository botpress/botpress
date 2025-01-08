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
      const { name } = projectDef.definition
      line.started(`Bundling integration ${chalk.bold(name)}...`)
      return await this._bundle(line)
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

  private async _bundle(line: SingleLineLogger, props: Partial<utils.esbuild.BuildCodeProps> = {}) {
    const logLevel = this.argv.verbose ? 'info' : 'silent'
    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')

    const unixPath = utils.path.toUnix(rel.entryPoint)
    const importFrom = utils.path.rmExtension(unixPath)
    const code = `import x from './${importFrom}'; export default x; export const handler = x.handler;`

    const outfile = abs.outFile // TODO: ensure dir exists
    line.debug(`Writing bundle to ${outfile}`)

    await utils.esbuild.buildCode({
      code,
      cwd: abs.workDir,
      outfile,
      logLevel,
      write: true,
      sourcemap: this.argv.sourceMap,
      minify: this.argv.minify,
      ...props,
    })

    line.success(`Bundle available at ${chalk.grey(rel.outDir)}`)
  }
}
