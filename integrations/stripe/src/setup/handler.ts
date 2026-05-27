import { fireChargeFailed } from 'src/events/charge-failed'
import { fireInvoicePaymentFailed } from 'src/events/invoice-payment-failed'
import { firePaymentIntentFailed } from 'src/events/payment-intent-failed'
import { fireSubscriptionCreated } from 'src/events/subscription-created'
import { fireSubscriptionDeleted } from 'src/events/subscription-deleted'
import { fireSubscriptionScheduleCreated } from 'src/events/subscription-schedule-created'
import { fireSubscriptionScheduleUpdated } from 'src/events/subscription-schedule-updated'
import { fireSubscriptionUpdated } from 'src/events/subscription-updated'
import Stripe from 'stripe'
import type { Handler } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'
import { ENABLED_EVENTS } from './register'

// Stand-in Stripe instance only used for webhook signature verification (no API calls).
// @ts-ignore
const _signatureVerifier = new Stripe('placeholder', { apiVersion: '2023-08-16' })

const _recreateWebhookWithSecret = async ({
  client,
  ctx,
  logger,
  priorWebhookId,
}: {
  client: Parameters<Handler>[0]['client']
  ctx: Parameters<Handler>[0]['ctx']
  logger: Parameters<Handler>[0]['logger']
  priorWebhookId?: string
}) => {
  if (!process.env.BP_WEBHOOK_URL) {
    throw new Error('BP_WEBHOOK_URL is not configured')
  }

  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  const { id: stripeWebhookId, secret: stripeWebhookSecret } = await stripeClient.createWebhookEndpointWithSecret({
    url: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`,
    enabled_events: ENABLED_EVENTS,
  })

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'stripeIntegrationInfo',
    payload: { stripeWebhookId, stripeWebhookSecret },
  })

  if (priorWebhookId) {
    try {
      await stripeClient.deleteWebhook(priorWebhookId)
    } catch (error) {
      logger.forBot().warn(`Failed to delete legacy Stripe webhook ${priorWebhookId}`, error)
    }
  }
}

export const handler: Handler = async ({ req, client, ctx, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Stripe webhook handler received an empty body')
    return { status: 400, body: 'Empty body' }
  }

  const sigHeader = req.headers['stripe-signature']
  if (!sigHeader) {
    logger.forBot().warn('Stripe webhook missing stripe-signature header')
    return { status: 400, body: 'Missing stripe-signature header' }
  }

  const integrationInfo = await client
    .getState({ type: 'integration', id: ctx.integrationId, name: 'stripeIntegrationInfo' })
    .then(({ state }) => state.payload)
    .catch(() => undefined)
  const webhookSecret = integrationInfo?.stripeWebhookSecret

  if (!webhookSecret) {
    try {
      await _recreateWebhookWithSecret({
        client,
        ctx,
        logger,
        priorWebhookId: integrationInfo?.stripeWebhookId,
      })
      logger.forBot().warn('Recreated Stripe webhook because the stored signing secret was missing')
      return { status: 202, body: 'Stripe webhook recreated; delivery skipped because it cannot be verified' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.forBot().error(`No Stripe webhook signing secret found and migration failed: ${message}`)
      return { status: 500, body: 'Webhook signing secret not configured' }
    }
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = _signatureVerifier.webhooks.constructEvent(req.body, sigHeader, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().warn(`Stripe webhook signature verification failed: ${message}`)
    return { status: 400, body: 'Invalid signature' }
  }

  switch (stripeEvent.type) {
    case 'charge.failed':
      await fireChargeFailed({ stripeEvent, client, logger })
      break
    case 'invoice.payment_failed':
      await fireInvoicePaymentFailed({ stripeEvent, client, logger })
      break
    case 'payment_intent.payment_failed':
      await firePaymentIntentFailed({ stripeEvent, client, logger })
      break
    case 'customer.subscription.created':
      await fireSubscriptionCreated({ stripeEvent, client, logger })
      break
    case 'customer.subscription.deleted':
      await fireSubscriptionDeleted({ stripeEvent, client, logger })
      break
    case 'customer.subscription.updated':
      await fireSubscriptionUpdated({ stripeEvent, client, logger })
      break
    case 'subscription_schedule.created':
      await fireSubscriptionScheduleCreated({ stripeEvent, client, logger })
      break
    case 'subscription_schedule.updated':
      await fireSubscriptionScheduleUpdated({ stripeEvent, client, logger })
      break
    default:
      logger.forBot().warn(`Unhandled Stripe event type ${stripeEvent.type}`)
  }

  return
}
