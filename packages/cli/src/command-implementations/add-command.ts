import * as fslib from 'fs'
import pathlib from 'path'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
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
      throw new errors.BotpressCLIError(`Integration ${this.argv.integrationRef} not found`)
    }

    const files = await codegen.generateIntegrationPackage(integration)
    await this._writeFiles(files)
  }

  private async _writeFiles(files: codegen.File[]): Promise<void> {
    const installPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    for (const file of files) {
      const filePath = utils.path.absoluteFrom(installPath, file.path)
      const dirPath = pathlib.dirname(filePath)
      await fslib.promises.mkdir(dirPath, { recursive: true })
      await fslib.promises.writeFile(filePath, file.content)
    }
  }
}
