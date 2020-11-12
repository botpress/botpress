import * as sdk from 'botpress/sdk'
import ms from 'ms'
import Socket from './socket'
import Repository from './repository'

export default (bp: typeof sdk, repository: Repository, cache: object) => {
  // Fires a realtime event when an agent's session is expired
  const registerTimeout = async (botId: string, agentId: string) => {
    const realtime = Socket(bp)

    const { agentSessionTimeout } = await bp.config.getModuleConfigForBot('hitl2', botId)

    // Clears previously registered timeout to avoid old timers to execute
    unregisterTimeout(agentId)

    // Set a new timeout that will fire a realtime event
    cache[agentId] = setTimeout(async () => {
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

  const unregisterTimeout = (agentId: string) => {
    if (cache[agentId]) {
      clearTimeout(cache[agentId])
    }
  }

  return { registerTimeout, unregisterTimeout }
}
