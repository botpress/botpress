import Stripe from 'stripe'
import { getOrCreateUserFromCustomer } from './utils'
import * as bp from '.botpress'

type Client = bp.Client
type Events = bp.events.Events
type IntegrationLogger = bp.Logger

export const fireSubscriptionUpdated = async ({
  stripeEvent,
  client,
  logger,
}: {
  stripeEvent: Stripe.CustomerSubscriptionUpdatedEvent
  client: Client
  logger: IntegrationLogger
}) => {
  const userResponse = await getOrCreateUserFromCustomer(client, stripeEvent.data.object.customer)
  let userId = 'no user'
  if (userResponse) {
    userId = userResponse.user.id
  }

  logger.forBot().debug('Triggering subscription updated event')

  const payload = {
    origin: 'stripe',
    userId,
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['subscriptionUpdated']

  await client.createEvent({
    type: 'subscriptionUpdated',
    payload,
  })
}
