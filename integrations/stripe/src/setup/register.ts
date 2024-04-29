import Stripe from 'stripe'
import { getClient } from '../client'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, client, webhookUrl, logger }) => {
  const StripeClient = getClient(ctx.configuration)

  const webhookData: Stripe.WebhookEndpointCreateParams = {
    url: webhookUrl,
    enabled_events: [
      'charge.failed',
      'customer.subscription.deleted',
      'customer.subscription.updated',
      'customer.subscription.created',
      'invoice.payment_failed',
      'payment_intent.payment_failed',
    ],
  }

  let stripeWebhookId
  try {
    stripeWebhookId = await StripeClient.createOrRetrieveWebhookId(webhookData)
  } catch (error) {
    logger.forBot().warn('error creating the integration in Stripe', error)
    return
  }

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'stripeIntegrationInfo',
    payload: {
      stripeWebhookId,
    },
  })
}
