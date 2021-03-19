import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { ActionDefinition, ActionServer, ActionServerWithActions } from 'common/typings'
import { ConfigProvider } from 'core/config'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import joi, { validate } from 'joi'
import _ from 'lodash'

import { actionServerIdRegex } from '../utils'

const HttpActionSchema = joi.array().items(
  joi.object().keys({
    name: joi.string(),
    description: joi.string(),
    category: joi.string(),
    author: joi.string().optional(),
    params: joi.array().items({
      name: joi.string(),
      description: joi.string(),
      type: joi.string(),
      required: joi.bool(),
      default: joi
        .alternatives()
        .try([joi.string().allow(''), joi.boolean(), joi.number()])
        .optional()
    })
  })
)

const ActionServerSchema = joi.object().keys({ id: joi.string().regex(actionServerIdRegex), baseUrl: joi.string() })
export const ActionServersConfigSchema = joi.object().keys({
  local: joi.object().keys({ enabled: joi.bool(), port: joi.number().port() }),
  remotes: joi.array().items(ActionServerSchema)
})

@injectable()
export class ActionServersService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ActionServersService')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}
  public async getServersWithActionsForBot(botId: string): Promise<ActionServerWithActions[]> {
    const actionServers = await this._getServers()

    const actionServersWithActions: ActionServerWithActions[] = []
    for (const actionServer of actionServers) {
      const actions = await this.fetchActions(botId, actionServer)
      actionServersWithActions.push({ ...actionServer, actions })
    }

    return actionServersWithActions
  }

  public async getServer(serverId: string): Promise<ActionServer | undefined> {
    const servers = await this._getServers()
    return servers.find(s => s.id === serverId)
  }

  private async _getServers(): Promise<ActionServer[]> {
    const { remotes, local } = (await this.configProvider.getBotpressConfig()).actionServers
    const { enabled, port } = local

    const actionServers = [...remotes].filter(r => {
      const { error } = joi.validate(r, ActionServerSchema)

      if (error) {
        this.logger.error(`Invalid Action Server configuration: ${error.message}`)
      }

      return !error
    })

    if (enabled) {
      actionServers.unshift({
        id: 'local',
        baseUrl: `http://localhost:${port}`
      })
    }

    return actionServers
  }

  private async fetchActions(botId, actionServer: ActionServer): Promise<ActionDefinition[] | undefined> {
    let actionDefinitions: ActionDefinition[] | undefined = undefined
    try {
      const { data } = await axios.get(`${actionServer.baseUrl}/actions/${botId}`)
      const { error } = validate(data, HttpActionSchema)
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
