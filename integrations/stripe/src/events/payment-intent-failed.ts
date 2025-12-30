import Stripe from 'stripe'
import { getOrCreateUserFromCustomer } from './utils'
import * as bp from '.botpress'

type Client = bp.Client
type Events = bp.events.Events
type IntegrationLogger = bp.Logger

export const firePaymentIntentFailed = async ({
  stripeEvent,
  client,
  logger,
}: {
  stripeEvent: Stripe.PaymentIntentPaymentFailedEvent
  client: Client
  logger: IntegrationLogger
}) => {
  const userResponse = await getOrCreateUserFromCustomer(client, stripeEvent.data.object.customer)
  let userId = 'no user'
  if (userResponse) {
    userId = userResponse.user.id
  }

  logger.forBot().debug('Triggering payment intent failed event')

  const payload = {
    origin: 'stripe',
    userId,
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['paymentIntentFailed']

  await client.createEvent({
    type: 'paymentIntentFailed',
    payload,
  })
}
