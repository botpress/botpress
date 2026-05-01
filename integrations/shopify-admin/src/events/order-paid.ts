import { transformOrderWebhookPayload, type OrderWebhookPayload } from '../transformers'
import * as bp from '.botpress'

type FireEventProps = bp.HandlerProps & { payload: OrderWebhookPayload }

export const fireOrderPaid = async ({ payload, client, logger }: FireEventProps) => {
  logger.forBot().info(`Received order paid event for order ${payload.name} (${payload.id})`)

  await client.createEvent({
    type: 'orderPaid',
    payload: transformOrderWebhookPayload(payload),
  })
}
