import { z } from '@botpress/sdk'
import { trelloIdSchema } from './entities'

export const webhookStateSchema = z
  .object({
    trelloWebhookId: trelloIdSchema
      .nullable()
      .default(null)
      .title('Trello Webhook ID')
      .describe('Unique id of the webhook that is created upon integration registration'),
  })
  .describe('State that stores the webhook id for the Trello integration')
