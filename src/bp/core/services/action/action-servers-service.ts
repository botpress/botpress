import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { ActionServer, ActionServerWithActions, HttpActionDefinition } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import joi, { validate } from 'joi'
import _ from 'lodash'

const HttpActionSchema = joi.array().items(
  joi.object().keys({
    name: joi.string(),
    description: joi.string(),
    category: joi.string(),
    author: joi.string().optional(),
    parameters: joi.array().items({
      name: joi.string(),
      description: joi.string(),
      type: joi.string().allow('string', 'number', 'boolean'),
      required: joi.bool(),
      default: joi
        .alternatives()
        .try([joi.string().allow(''), joi.boolean(), joi.number()])
        .optional()
    })
  })
)

@injectable()
export default class ActionServersService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ActionServersService')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}
  public async getServersWithActionsForBot(botId: string): Promise<ActionServerWithActions[]> {
    const actionServers = await this.getServers()

    const actionServersWithActions: ActionServerWithActions[] = []
    for (const actionServer of actionServers) {
      const actions = await this.fetchActions(botId, actionServer)
      actionServersWithActions.push({ ...actionServer, actions })
    }

    return actionServersWithActions
  }

  public async getServer(serverId: string): Promise<ActionServer | undefined> {
    const servers = await this.getServers()
    return servers.find(s => s.id === serverId)
  }

  public async getServers(): Promise<ActionServer[]> {
    const config = await this.configProvider.getBotpressConfig()
    const actionServersConfig = config.actionServers
    const actionServers = [...actionServersConfig.remoteActionServers]
    if (actionServersConfig.localActionServer.enabled) {
      actionServers.unshift({
        id: 'local',
        baseUrl: `http://localhost:${actionServersConfig.localActionServer.port}`
      })
    }

    return actionServers
  }

  private async fetchActions(botId, actionServer: ActionServer): Promise<HttpActionDefinition[] | undefined> {
    let actionDefinitions: HttpActionDefinition[] | undefined = undefined
    try {
      const { data } = await axios.get(`${actionServer.baseUrl}/actions/${botId}`)
      const { value, error } = validate(data, HttpActionSchema)
      if (error && error.name === 'ValidationError') {
        this.logger.error(
          `Action Server ${actionServer.id} returned invalid Action definitions: ${error.details.map(d => d.message)}`
        )
      } else {
        actionDefinitions = data
      }
    } catch (e) {
      this.logger.attachError(e).error(`Could not fetch actions for Action Server ${actionServer.id}`)
    }

    return actionDefinitions
  }
}
