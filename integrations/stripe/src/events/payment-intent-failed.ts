import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import Stripe from 'stripe'
import { Client } from '.botpress'
import { Events } from '.botpress/implementation/events'

export const firePaymentIntentFailed = async ({
  stripeEvent,
  client,
  logger,
}: {
  stripeEvent: Stripe.PaymentIntentPaymentFailedEvent
  client: Client
  logger: IntegrationLogger
}) => {
  const { user } = await client.getOrCreateUser({
    tags: {
      id:
        typeof stripeEvent.data.object.customer === 'string'
          ? stripeEvent.data.object.customer
          : stripeEvent.data.object.customer?.id,
    },
  })

  logger.forBot().debug('Triggering payment intent failed event')

  const payload = {
    origin: 'stripe',
    userId: user.id,
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['paymentIntentFailed']

  await client.createEvent({
    type: 'paymentIntentFailed',
    payload,
  })
}
