import { transformOrderWebhookPayload, type OrderWebhookPayload } from '../transformers'
import * as bp from '.botpress'

type FireEventProps = bp.HandlerProps & { payload: OrderWebhookPayload }

export const fireOrderCancelled = async ({ payload, client, logger }: FireEventProps) => {
  logger.forBot().info(`Received order cancelled event for order ${payload.name} (${payload.id})`)

  await client.createEvent({
    type: 'orderCancelled',
    payload: transformOrderWebhookPayload(payload),
  })
}
