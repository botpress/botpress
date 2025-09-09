import { TIntegration } from ".botpress"
import { WebhookHandlerProps } from "@botpress/sdk/dist/integration"
import { fullEmailEventSchema } from "definitions/schemas"
import { TValidWebhookEventPayload, formatWebhookEventPayload } from "src/loops.webhook"

export const fireEmailSoftBounced = async (client: WebhookHandlerProps<TIntegration>['client'], payload: TValidWebhookEventPayload): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, fullEmailEventSchema)

  await client.createEvent({
    type: 'emailSoftBounced',
    payload: formattedPayload,
  })
}