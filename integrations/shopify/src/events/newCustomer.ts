import { newCustomerSchema } from 'src/schemas'
import * as botpress from '.botpress'

type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
type RegisterFunction = Implementation['handler']
type IntegrationContext = Parameters<RegisterFunction>[0]['ctx']
type Client = Parameters<RegisterFunction>[0]['client']

export const fireNewCustomer = async ({
  req,
  client,
  ctx,
  logger,
}: {
  req: any
  client: Client
  ctx: IntegrationContext
  logger: any
}) => {
  const shopifyEvent = JSON.parse(req.body)

  const payload = {
    shopName: ctx.configuration.shopName,
    id: shopifyEvent.id,
    email: shopifyEvent.email,
    accepts_marketing: shopifyEvent.accepts_marketing,
    first_name: shopifyEvent.first_name,
    last_name: shopifyEvent.last_name,
    orders_count: shopifyEvent.orders_count,
    state: shopifyEvent.state,
    total_spent: shopifyEvent.total_spent,
    last_order_id: shopifyEvent.last_order_id,
    note: shopifyEvent.note,
  }

  const parsedObject = newCustomerSchema.parse(payload)

  logger.forBot().info(`Recieved a customer created event for ${shopifyEvent.email}`)

  await client.createEvent({
    type: 'newCustomer',
    payload: parsedObject,
  })
}
