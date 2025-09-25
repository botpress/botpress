import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'
import { fullEmailEventSchema } from 'definitions/schemas'
import { ValidWebhookEventPayload, formatWebhookEventPayload } from 'src/loops.webhook'
import { TIntegration } from '.botpress'

export const fireEmailSoftBounced = async (
  client: WebhookHandlerProps<TIntegration>['client'],
  payload: ValidWebhookEventPayload
): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, fullEmailEventSchema)

  await client.createEvent({
    type: 'emailSoftBounced',
    payload: formattedPayload,
  })
}
