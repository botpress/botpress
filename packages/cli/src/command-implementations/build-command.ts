import type commandDefinitions from '../command-definitions'
import { BundleCommand } from './bundle-command'
import { GenerateCommand } from './gen-command'
import { ProjectCommand } from './project-command'

export type BuildCommandDefinition = typeof commandDefinitions.build
export class BuildCommand extends ProjectCommand<BuildCommandDefinition> {
  public async run(): Promise<void> {
    const t0 = Date.now()
    const { type: projectType, definition: integrationDef } = await this.readProjectDefinitionFromFS()

    if (projectType === 'interface') {
      this.logger.success('Interface projects have nothing to build.')
      return
    }

    if (integrationDef) {
      await this._runGenerate()
    }

    await this._runBundle()
    const dt = Date.now() - t0
    this.logger.log(`Build completed in ${dt}ms`)
  }

  private _runGenerate() {
    return new GenerateCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private _runBundle() {
    return new BundleCommand(this.api, this.prompt, this.logger, this.argv).run()
  }
}
