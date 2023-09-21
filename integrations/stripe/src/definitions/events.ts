import { IntegrationDefinitionProps } from '@botpress/sdk'
import {
  chargeFailedSchema,
  invoicePaymentFailedSchema,
  paymentIntentFailedSchema,
  subscriptionDeletedSchema,
  subscriptionUpdatedSchema,
} from './schemas'

const chargeFailed = {
  schema: chargeFailedSchema,
  title: 'Charge Failed',
  description: 'This event occurs when a charge fails in Stripe.',
}

const subscriptionDeleted = {
  schema: subscriptionDeletedSchema,
  title: 'Subscription Deleted',
  description:
    'This event occurs when a subscription is canceled/deleted in Stripe.',
}

const subscriptionUpdated = {
  schema: subscriptionUpdatedSchema,
  title: 'Subscription Updated',
  description:
    'This event occurs when a subscription is updated in Stripe. For example when the subscription is cancelled, but does not terminate immediately cancel_at_period_end goes to true.',
}

const invoicePaymentFailed = {
  schema: invoicePaymentFailedSchema,
  title: 'Invoice Payment Failed',
  description: 'This event occurs when an invoice payment fails in Stripe.',
}

const paymentIntentFailed = {
  schema: paymentIntentFailedSchema,
  title: 'Payment Intent Failed',
  description: 'This event occurs when a payment intent fails in Stripe.',
}

export const events = {
  chargeFailed,
  subscriptionDeleted,
  subscriptionUpdated,
  invoicePaymentFailed,
  paymentIntentFailed,
} satisfies IntegrationDefinitionProps['events']
