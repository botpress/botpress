import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'
import { fullEmailEventSchema } from 'definitions/schemas'
import { formatWebhookEventPayload, ValidWebhookEventPayload } from 'src/loops.webhook'
import { TIntegration } from '.botpress'

export const fireEmailDelivered = async (
  client: WebhookHandlerProps<TIntegration>['client'],
  payload: ValidWebhookEventPayload
): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, fullEmailEventSchema)

  await client.createEvent({
    type: 'emailDelivered',
    payload: formattedPayload,
  })
}
