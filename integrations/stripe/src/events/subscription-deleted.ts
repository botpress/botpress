import Stripe from 'stripe'
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
  const { user } = await client.getOrCreateUser({
    tags: {
      id:
        typeof stripeEvent.data.object.customer === 'string'
          ? stripeEvent.data.object.customer
          : stripeEvent.data.object.customer?.id,
    },
  })

  logger.forBot().debug('Triggering subscription deleted event')

  const payload = {
    origin: 'stripe',
    userId: user.id,
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['subscriptionDeleted']

  await client.createEvent({
    type: 'subscriptionDeleted',
    payload,
  })
}
