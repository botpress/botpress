import { fireChargeFailed } from 'src/events/charge-failed'
import { fireInvoicePaymentFailed } from 'src/events/invoice-payment-failed'
import { firePaymentIntentFailed } from 'src/events/payment-intent-failed'
import { fireSubscriptionDeleted } from 'src/events/subscription-deleted'
import { fireSubscriptionUpdated } from 'src/events/subscription-updated'
import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req, client }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }
  const stripeEvent = JSON.parse(req.body)

  switch (stripeEvent.type) {
    case 'charge.failed':
      await fireChargeFailed({ stripeEvent, client })
      break
    case 'invoice.payment_failed':
      await fireInvoicePaymentFailed({ stripeEvent, client })
      break
    case 'payment_intent.payment_failed':
      await firePaymentIntentFailed({ stripeEvent, client })
      break
    case 'customer.subscription.deleted':
      await fireSubscriptionDeleted({ stripeEvent, client })
      break
    case 'customer.subscription.updated':
      await fireSubscriptionUpdated({ stripeEvent, client })
      break
    default:
      console.warn(`Unhandled event type ${stripeEvent.type}`)
  }
}
