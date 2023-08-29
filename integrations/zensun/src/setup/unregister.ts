import type { UnregisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const unregister: UnregisterFunction = async ({ ctx, client }) => {
  const ZensunClient = getClient(ctx.configuration)
  const stateZensunIntegrationInfo = await client.getState({
    id: ctx.integrationId,
    name: 'zensunIntegrationInfo',
    type: 'integration',
  })
  const { state } = stateZensunIntegrationInfo
  const { zensunIntegrationId } = state.payload
  if (zensunIntegrationId) {
    await ZensunClient.deleteIntegration(zensunIntegrationId)
  }
}
