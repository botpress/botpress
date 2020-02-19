import axios from 'axios'
import { ActionServer } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import allSettled from 'promise.allsettled'
import { PromiseResolution } from 'promise.allsettled/types'

import { ActionDefinition } from './action-service'
import { ActionMetadata } from './metadata'

interface ActionServersWithActions {
  actionServer: ActionServer
  actions: ActionDefinition[]
  actionsFetchedSuccessfully: boolean
}

interface RemoteActionDefinition {
  name: string
  metadata: ActionMetadata
}

const fetchActionsForServer = async (botId: string, actionServer: ActionServer): Promise<ActionDefinition[]> => {
  const actions: RemoteActionDefinition[] = (await axios.get(`${actionServer.baseUrl}/actions/${botId}`)).data

  return actions.map(
    (a): ActionDefinition => {
      return { name: a.name, isRemote: true, location: 'local', metadata: a.metadata }
    }
  )
}

const fetchActions = async (botId: string, actionServers: ActionServer[]): Promise<ActionServersWithActions[]> => {
  const results = await allSettled(actionServers.map(s => fetchActionsForServer(botId, s)))
  return results.map((r, idx) => {
    const actionServer = actionServers[idx]
    let actions
    let actionsFetchedSuccessfully
    if (r.status === 'fulfilled') {
      actions = (r as PromiseResolution<ActionDefinition[]>).value
      actionsFetchedSuccessfully = true
    } else {
      actions = []
      actionsFetchedSuccessfully = false
    }

    return { actionServer, actions, actionsFetchedSuccessfully }
  })
}

@injectable()
export default class ActionServersService {
  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}
  public async getServersWithActionsForBot(botId: string): Promise<ActionServersWithActions[]> {
    const config = await this.configProvider.getBotpressConfig()
    const actionServersConfig = config.actionServers
    const actionServers = [...actionServersConfig.remoteActionServers]
    if (actionServersConfig.localActionServer.enabled) {
      actionServers.unshift({
        id: 'local',
        baseUrl: `http://localhost:${actionServersConfig.localActionServer.port}`
      })
    }

    return fetchActions(botId, actionServers)
  }
}
