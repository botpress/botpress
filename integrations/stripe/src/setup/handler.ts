import { fireChargeFailed } from 'src/events/charge-failed'
import { fireInvoicePaymentFailed } from 'src/events/invoice-payment-failed'
import { firePaymentIntentFailed } from 'src/events/payment-intent-failed'
import { fireSubscriptionCreated } from 'src/events/subscription-created'
import { fireSubscriptionDeleted } from 'src/events/subscription-deleted'
import { fireSubscriptionUpdated } from 'src/events/subscription-updated'
import Stripe from 'stripe'
import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req, client, logger }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }
  const stripeEvent = JSON.parse(req.body) as Stripe.Event

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
    default:
      console.warn(`Unhandled event type ${stripeEvent.type}`)
  }
}
