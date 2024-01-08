import Stripe from 'stripe'
import { Client } from '.botpress'
import { Events } from '.botpress/implementation/events'

export const fireInvoicePaymentFailed = async ({
  stripeEvent,
  client,
}: {
  stripeEvent: Stripe.Event
  client: Client
}) => {
  const { user } = await client.getOrCreateUser({
    tags: {
      id: (stripeEvent.data.object as { customer: string })?.customer || '',
    },
  })

  const payload = {
    origin: 'stripe',
    userId: user?.id || '',
    data: { type: stripeEvent.type, object: { ...stripeEvent.data.object } },
  } satisfies Events['invoicePaymentFailed']

  await client.createEvent({
    type: 'invoicePaymentFailed',
    payload,
  })
}
