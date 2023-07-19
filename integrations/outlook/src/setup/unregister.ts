import type { UnregisterFunction } from '../misc/types'

import { getClient } from '../utils'

export const unregister: UnregisterFunction = async ({ ctx, client }) => {
  const graphClient = getClient(ctx.configuration)
  const stateRes = await client.getState({
    id: ctx.integrationId,
    name: 'subscriptionInfo',
    type: 'integration',
  })

  const { state } = stateRes
  const { subscriptionId } = state.payload

  await graphClient.unsubscribeWebhook(subscriptionId)
}
