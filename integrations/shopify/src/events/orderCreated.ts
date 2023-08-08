import { Client } from '@botpress/client'
import type { IntegrationContext } from '@botpress/sdk'
import { orderCreatedSchema } from 'src/schemas/schemas'
import * as botpress from '.botpress'

export const fireOrderCreated = async ({
  req,
  client,
  ctx,
  logger,
}: {
  req: any
  client: Client
  ctx: IntegrationContext<botpress.configuration.Configuration>
  logger: any
}) => {
  const shopifyEvent = JSON.parse(req.body)

  const payload = {
    order_id: shopifyEvent.id,
    shopName: ctx.configuration.shopName,
    confirmation_number: shopifyEvent.confirmation_number,
    created_at: shopifyEvent.created_at,
    currency: shopifyEvent.currency,
    current_subtotal_price: shopifyEvent.current_subtotal_price,
    current_total_discounts: shopifyEvent.current_total_discounts,
    current_total_price: shopifyEvent.current_total_price,
    current_total_tax: shopifyEvent.current_total_tax,
    customer_locale: shopifyEvent.customer_locale,
    order_status_url: shopifyEvent.order_status_url,
    fullBody: req,
  }

  const parsedObject = orderCreatedSchema.parse(payload)

  logger.forBot().info(`Recieved an order created event for ${shopifyEvent.id}`)

  await client.createEvent({
    type: 'orderCreated',
    payload: parsedObject,
  })
}