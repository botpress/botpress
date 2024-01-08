import type { UnregisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const unregister: UnregisterFunction = async ({ ctx, client }) => {
  const StripeClient = getClient(ctx.configuration)
  const stateStripeIntegrationInfo = await client.getState({
    id: ctx.integrationId,
    name: 'stripeIntegrationInfo',
    type: 'integration',
  })
  const { state } = stateStripeIntegrationInfo
  const { stripeWebhookId } = state.payload
  if (stripeWebhookId) {
    const response = await StripeClient.deleteWebhook(stripeWebhookId)
    if (response.deleted) {
      console.info(`Webhook successfully deleted - ${response.id}`)
    }
  }
}
