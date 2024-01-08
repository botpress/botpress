import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import Stripe from 'stripe'
import { Client } from '.botpress'
import { Events } from '.botpress/implementation/events'

export const fireChargeFailed = async ({
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

  logger.forBot().debug('Triggering charge failed event')

  const payload = {
    origin: 'stripe',
    userId: user?.id || '',
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['chargeFailed']

  await client.createEvent({
    type: 'chargeFailed',
    payload,
  })
}
