import chalk from 'chalk'
import type commandDefinitions from '../command-definitions'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type BundleCommandDefinition = typeof commandDefinitions.bundle
export class BundleCommand extends ProjectCommand<BundleCommandDefinition> {
  public async run(): Promise<void> {
    const { type: projectType, definition: integrationDef } = await this.readProjectDefinitionFromFS()

    if (projectType === 'interface') {
      this.logger.success('Interface projects have nothing to bundle.')
      return
    }

    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')

    const line = this.logger.line()

    const logLevel = this.argv.verbose ? 'info' : 'silent'

    if (integrationDef) {
      const { name } = integrationDef
      line.started(`Bundling integration ${chalk.bold(name)}...`)
    } else {
      line.started('Bundling bot...')
    }

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
    })

    line.success(`Bundle available at ${chalk.grey(rel.outDir)}`)
  }
}
