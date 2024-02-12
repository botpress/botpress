import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import Stripe from 'stripe'
import { Client } from '.botpress'
import { Events } from '.botpress/implementation/events'

export const fireSubscriptionUpdated = async ({
  stripeEvent,
  client,
  logger,
}: {
  stripeEvent: Stripe.Event
  client: Client
  logger: IntegrationLogger
}) => {
  const { user } = await client.getOrCreateUser({
    tags: {
      id: (stripeEvent.data.object as { customer: string })?.customer || '',
    },
  })

  logger.forBot().debug('Triggering subscription updated event')

  const payload = {
    origin: 'stripe',
    userId: user?.id || '',
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['subscriptionUpdated']

  await client.createEvent({
    type: 'subscriptionUpdated',
    payload,
  })
}
