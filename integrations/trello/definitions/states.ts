import { type IntegrationDefinitionProps, z } from '@botpress/sdk'
import { trelloIdSchema } from './schemas'

export const States = {
  webhookState: 'webhookState',
} as const

export const states = {
  [States.webhookState]: {
    type: 'integration',
    schema: z
      .object({
        trelloWebhookId: trelloIdSchema
          .nullable()
          .default(null)
          .title('Trello Webhook ID')
          .describe('Unique id of the webhook that is created upon integration registration'),
      })
      .describe('State that stores the webhook id for the Trello integration'),
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['states']>
