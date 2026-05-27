import * as sdk from '@botpress/sdk'
import Stripe from 'stripe'
import type { RegisterFunction } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const ENABLED_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'charge.failed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
  'customer.subscription.created',
  'invoice.payment_failed',
  'payment_intent.payment_failed',
  'subscription_schedule.created',
  'subscription_schedule.updated',
]

export const register: RegisterFunction = async ({ ctx, client, webhookUrl, logger }) => {
  let stripeClient: StripeClient
  try {
    stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new sdk.RuntimeError(`Failed to load Stripe credentials. Re-run the setup wizard. (${message})`)
  }

  let accountId: string
  try {
    const account = await stripeClient.retrieveAccount()
    accountId = account.id
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new sdk.RuntimeError(`Failed to connect to Stripe. (${message})`)
  }

  await client.configureIntegration({ identifier: accountId })

  const prior = await client
    .getState({ type: 'integration', id: ctx.integrationId, name: 'stripeIntegrationInfo' })
    .then(({ state }) => state.payload)
    .catch(() => undefined)

  const { id: stripeWebhookId, secret: stripeWebhookSecret } = await stripeClient.createWebhookEndpointWithSecret({
    url: webhookUrl,
    enabled_events: ENABLED_EVENTS,
  })

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'stripeIntegrationInfo',
    payload: { stripeWebhookId, stripeWebhookSecret },
  })

  if (prior?.stripeWebhookId && prior.stripeWebhookId !== stripeWebhookId) {
    try {
      await stripeClient.deleteWebhook(prior.stripeWebhookId)
    } catch (error) {
      logger.forBot().warn(`Failed to delete prior Stripe webhook ${prior.stripeWebhookId}`, error)
    }
  }

  logger.forBot().info('Connection to Stripe successful')
}
