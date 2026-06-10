import type { UnregisterFunction } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  let stripeClient: StripeClient
  try {
    stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  } catch {
    logger.forBot().warn('No Stripe credentials available; skipping webhook teardown')
    return
  }

  const stateStripeIntegrationInfo = await client
    .getState({ id: ctx.integrationId, name: 'stripeIntegrationInfo', type: 'integration' })
    .catch(() => undefined)

  if (!stateStripeIntegrationInfo) return

  const { stripeWebhookId } = stateStripeIntegrationInfo.state.payload
  if (stripeWebhookId) {
    const response = await stripeClient.deleteWebhook(stripeWebhookId)
    if (response.deleted) {
      logger.forBot().info(`Webhook successfully deleted - ${response.id}`)
    }
  }
}
