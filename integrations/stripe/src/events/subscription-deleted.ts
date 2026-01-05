import Stripe from 'stripe'
import { getUserIdFromCustomer } from './utils'
import * as bp from '.botpress'

type Client = bp.Client
type Events = bp.events.Events
type IntegrationLogger = bp.Logger

export const fireSubscriptionDeleted = async ({
  stripeEvent,
  client,
  logger,
}: {
  stripeEvent: Stripe.CustomerSubscriptionDeletedEvent
  client: Client
  logger: IntegrationLogger
}) => {
  const userId = await getUserIdFromCustomer(client, stripeEvent.data.object.customer)

  logger.forBot().debug('Triggering subscription deleted event')

  const payload = {
    origin: 'stripe',
    userId,
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['subscriptionDeleted']

  await client.createEvent({
    type: 'subscriptionDeleted',
    payload,
  })
}
