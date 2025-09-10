import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'
import { campaignOrLoopEmailEventSchema } from 'definitions/schemas'
import { TValidWebhookEventPayload, formatWebhookEventPayload } from 'src/loops.webhook'
import { TIntegration } from '.botpress'

export const fireEmailUnsubscribed = async (
  client: WebhookHandlerProps<TIntegration>['client'],
  payload: TValidWebhookEventPayload
): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, campaignOrLoopEmailEventSchema)

  await client.createEvent({
    type: 'emailUnsubscribed',
    payload: formattedPayload,
  })
}
