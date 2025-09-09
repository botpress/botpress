import { TIntegration } from ".botpress";
import { WebhookHandlerProps } from "@botpress/sdk/dist/integration";
import { fullEmailEventSchema } from "definitions/schemas";
import { formatWebhookEventPayload, TValidWebhookEventPayload } from "src/loops.webhook";

export const fireEmailDelivered = async (client: WebhookHandlerProps<TIntegration>['client'], payload: TValidWebhookEventPayload): Promise<void> => {
  const formattedPayload = formatWebhookEventPayload(payload, fullEmailEventSchema)

  await client.createEvent({
    type: 'emailDelivered',
    payload: formattedPayload,
  })
}