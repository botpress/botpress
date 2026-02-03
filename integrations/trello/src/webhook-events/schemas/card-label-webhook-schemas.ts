import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { labelSchema } from 'definitions/events/card-label-events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema } from 'definitions/schemas'
import { trelloWebhookSchema } from './common'

export const cardLabelAddedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.LABEL_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    label: labelSchema,
  }),
})
export type CardLabelAddedWebhook = z.infer<typeof cardLabelAddedWebhookSchema>

export const cardLabelRemovedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.LABEL_REMOVED_FROM_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    label: labelSchema,
  }),
})
export type CardLabelRemovedWebhook = z.infer<typeof cardLabelRemovedWebhookSchema>
