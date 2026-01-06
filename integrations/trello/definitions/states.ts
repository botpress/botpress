import { type IntegrationDefinitionProps, z } from '@botpress/sdk'
import { trelloIdSchema } from './schemas'

const _webhookIdStateSchema = trelloIdSchema
  .nullable()
  .default(null)
  .title('Trello Webhook ID')
  .describe('Unique id of the webhook that is created upon integration registration')
export type WebhookIdState = z.infer<typeof _webhookIdStateSchema>

export const states = {
  webhook: {
    type: 'integration',
    schema: z
      .object({ trelloWebhookId: _webhookIdStateSchema })
      .describe('State that stores the webhook id for the Trello integration'),
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['states']>
