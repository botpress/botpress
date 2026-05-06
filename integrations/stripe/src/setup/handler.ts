import Stripe from 'stripe'
import { fireChargeFailed } from 'src/events/charge-failed'
import { fireInvoicePaymentFailed } from 'src/events/invoice-payment-failed'
import { firePaymentIntentFailed } from 'src/events/payment-intent-failed'
import { fireSubscriptionCreated } from 'src/events/subscription-created'
import { fireSubscriptionDeleted } from 'src/events/subscription-deleted'
import { fireSubscriptionScheduleCreated } from 'src/events/subscription-schedule-created'
import { fireSubscriptionScheduleUpdated } from 'src/events/subscription-schedule-updated'
import { fireSubscriptionUpdated } from 'src/events/subscription-updated'
import type { Handler } from '../misc/types'

// Stand-in Stripe instance only used for webhook signature verification (no API calls).
// @ts-ignore
const _signatureVerifier = new Stripe('placeholder', { apiVersion: '2023-08-16' })

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

  const webhookSecret = await client
    .getState({ type: 'integration', id: ctx.integrationId, name: 'stripeIntegrationInfo' })
    .then(({ state }) => state.payload.stripeWebhookSecret)
    .catch(() => undefined)

  if (!webhookSecret) {
    logger.forBot().error('No Stripe webhook signing secret found; rejecting delivery')
    return { status: 500, body: 'Webhook signing secret not configured' }
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
