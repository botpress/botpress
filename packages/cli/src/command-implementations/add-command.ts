import * as fslib from 'fs'
import * as pathlib from 'path'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import { parseIntegrationRef } from '../integration-ref'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends GlobalCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parseIntegrationRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidIntegrationReferenceError(this.argv.integrationRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot install local integrations yet')
    }

    const integration = await api.findIntegration(parsedRef)
    if (!integration) {
      throw new errors.BotpressCLIError(`Integration "${this.argv.integrationRef}" not found`)
    }

    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    const installPath = utils.path.join(baseInstallPath, consts.installDirName, integration.name) // TODO: eventually replace name by alias (with argv --alias)

    const alreadyInstalled = fslib.existsSync(installPath)
    if (alreadyInstalled) {
      this.logger.warn(`Integration with name "${integration.name}" already installed.`)
      const res = await this.prompt.confirm('Do you want to overwrite the existing instance?')
      if (!res) {
        this.logger.log('Aborted')
        return
      }

      await this._uninstall(installPath)
    }

    const files = await codegen.generateIntegrationPackage(integration)
    await this._install(installPath, files)
  }

  private async _install(installPath: utils.path.AbsolutePath, files: codegen.File[]): Promise<void> {
    for (const file of files) {
      const filePath = utils.path.absoluteFrom(installPath, file.path)
      const dirPath = pathlib.dirname(filePath)
      await fslib.promises.mkdir(dirPath, { recursive: true })
      await fslib.promises.writeFile(filePath, file.content)
    }
  }

  private async _uninstall(installPath: utils.path.AbsolutePath): Promise<void> {
    await fslib.promises.rmdir(installPath, { recursive: true })
  }
}
