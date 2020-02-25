import axios from 'axios'
import { ActionDefinition, ActionMetadata, ActionServer, ActionServersWithActions } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import allSettled from 'promise.allsettled'
import { PromiseResolution } from 'promise.allsettled/types'

interface RemoteActionDefinition {
  name: string
  metadata: ActionMetadata
}

const fetchActionsForServer = async (botId: string, actionServer: ActionServer): Promise<ActionDefinition[]> => {
  const actions: RemoteActionDefinition[] = (await axios.get(`${actionServer.baseUrl}/actions/${botId}`)).data

  return actions.map(
    (action): ActionDefinition => {
      return { name: action.name, isRemote: true, location: 'local', metadata: action.metadata, legacy: false }
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

    return { id: actionServer.id, baseUrl: actionServer.baseUrl, actions, actionsFetchedSuccessfully }
  })
}

@injectable()
export default class ActionServersService {
  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}
  public async getServersWithActionsForBot(botId: string): Promise<ActionServersWithActions[]> {
    const actionServers = await this.getServers()

    return fetchActions(botId, actionServers)
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
}
