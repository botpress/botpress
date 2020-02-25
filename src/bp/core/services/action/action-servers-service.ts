import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { ActionServer, ActionServersWithActions, HttpActionDefinition } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import { validate } from 'joi'
import joi from 'joi'
import allSettled from 'promise.allsettled'

const HttpActionSchema = joi.array().items(
  joi.object().keys({
    name: joi.string(),
    description: joi.string(),
    category: joi.string(),
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
  public async getServersWithActionsForBot(botId: string): Promise<ActionServersWithActions[]> {
    const actionServers = await this.getServers()

    return this.fetchActions(botId, actionServers)
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

  private async fetchActions(botId: string, actionServers: ActionServer[]): Promise<ActionServersWithActions[]> {
    const results = await allSettled(actionServers.map(s => axios.get(`${s.baseUrl}/actions/${botId}`)))

    return results.map((r, idx) => {
      const actionServer = actionServers[idx]

      let actions: HttpActionDefinition[] = []
      let actionsFetchedSuccessfully = false

      if (r.status === 'fulfilled') {
        actions = r.value.data as HttpActionDefinition[]
        const { value, error } = validate(actions, HttpActionSchema)
        if (error && error.name === 'ValidationError') {
          this.logger.error(
            `Action Server ${actionServer.id} returned invalid Action definitions: ${error.details.map(d => d.message)}`
          )
          actions = []
        } else {
          actionsFetchedSuccessfully = true
        }
      } else {
        this.logger.error(`Could not fetch actions for Action Server ${actionServer.id}`)
      }

      return { id: actionServer.id, baseUrl: actionServer.baseUrl, actions, actionsFetchedSuccessfully }
    })
  }
}
