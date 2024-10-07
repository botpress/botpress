import { z } from '@botpress/sdk'
import { TrelloIDSchema } from './entities'

export const webhookStateSchema = z
  .object({
    trelloWebhookId: TrelloIDSchema.or(z.null())
      .describe('Unique id of the webhook that is created upon integration registration')
      .default(null),
  })
  .describe('State that stores the webhook id for the Trello integration')
