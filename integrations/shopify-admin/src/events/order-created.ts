import { transformOrderWebhookPayload, type OrderWebhookPayload } from '../transformers'
import * as bp from '.botpress'

type FireEventProps = bp.HandlerProps & { payload: OrderWebhookPayload }

export const fireOrderCreated = async ({ payload, client, logger }: FireEventProps) => {
  logger.forBot().info(`Received order created event for order ${payload.name} (${payload.id})`)

  await client.createEvent({
    type: 'orderCreated',
    payload: transformOrderWebhookPayload(payload),
  })
}
