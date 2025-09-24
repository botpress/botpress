import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'
import { campaignOrLoopEmailEventSchema } from 'definitions/schemas'
import { ValidWebhookEventPayload, formatWebhookEventPayload } from 'src/loops.webhook'
import { TIntegration } from '.botpress'

export const fireEmailUnsubscribed = async (
  client: WebhookHandlerProps<TIntegration>['client'],
  payload: ValidWebhookEventPayload
): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, campaignOrLoopEmailEventSchema)

  await client.createEvent({
    type: 'emailUnsubscribed',
    payload: formattedPayload,
  })
}
