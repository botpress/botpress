import * as sdk from 'botpress/sdk'
import ms from 'ms'

import Repository from './repository'
import Socket from './socket'

export default (bp: typeof sdk, repository: Repository, cache: object) => {
  // Fires a realtime event when an agent's session is expired
  const registerTimeout = async (workspaceId: string, botId: string, agentId: string) => {
    const realtime = Socket(bp)

    const key = cacheKey(workspaceId, botId, agentId)
    const { agentSessionTimeout } = await bp.config.getModuleConfigForBot('hitl2', botId)

    // Clears previously registered timeout to avoid old timers to execute
    unregisterTimeout(workspaceId, botId, agentId)

    // Set a new timeout that will fire a realtime event
    cache[key] = setTimeout(async () => {
      // By now the agent *should* be offline, but we check nonetheless
      const online = await repository.getAgentOnline(botId, agentId)
      const payload = { online }

      realtime.sendPayload(botId, {
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload
      })
    }, ms(agentSessionTimeout as string))
  }

  const unregisterTimeout = (workspaceId: string, botId: string, agentId: string) => {
    const key = cacheKey(workspaceId, botId, agentId)

    if (cache[key]) {
      clearTimeout(cache[key])
    }
  }

  return { registerTimeout, unregisterTimeout }
}

// Cache key that scopes agent status on a per-workspace basis.
// It could also be scoped on a per-bot basis.
export const cacheKey = (workspaceId: string, botId: string, agentId: string) => {
  return [workspaceId, agentId].join('.')
}
