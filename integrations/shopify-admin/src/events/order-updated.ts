import { transformOrderWebhookPayload, type OrderWebhookPayload } from '../transformers'
import * as bp from '.botpress'

type FireEventProps = bp.HandlerProps & { payload: OrderWebhookPayload }

export const fireOrderUpdated = async ({ payload, client, logger }: FireEventProps) => {
  logger.forBot().info(`Received order updated event for order ${payload.name} (${payload.id})`)

  await client.createEvent({
    type: 'orderUpdated',
    payload: transformOrderWebhookPayload(payload),
  })
}
