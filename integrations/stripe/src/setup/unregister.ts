import { getClient } from '../client'
import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
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
      logger.forBot().info(`Webhook successfully deleted - ${response.id}`)
    }
  }
}
