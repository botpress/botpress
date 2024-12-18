import { prepareCreateBotBody } from '../api/bot-body'
import { prepareCreateIntegrationBody } from '../api/integration-body'
import { prepareCreateInterfaceBody } from '../api/interface-body'
import { prepareCreatePluginBody } from '../api/plugin-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'integration') {
      const parsed = await prepareCreateIntegrationBody(projectDef.definition)
      // TODO: display interface implementation statements here
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'interface') {
      const parsed = await prepareCreateInterfaceBody(projectDef.definition)
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'bot') {
      const parsed = await prepareCreateBotBody(projectDef.definition)
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'plugin') {
      const parsed = await prepareCreatePluginBody(projectDef.definition)
      this.logger.json(parsed)
      return
    }

    type _assertion = utils.types.AssertNever<typeof projectDef>
    throw new errors.BotpressCLIError('Unsupported project type')
  }
}
