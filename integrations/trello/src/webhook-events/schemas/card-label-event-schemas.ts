import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { labelSchema } from 'definitions/events/card-label-events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema } from 'definitions/schemas'
import { trelloEventActionSchema } from './common'

export const cardLabelAddedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.LABEL_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    label: labelSchema,
  }),
})
export type CardLabelAddedEventAction = z.infer<typeof cardLabelAddedEventActionSchema>

export const cardLabelRemovedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.LABEL_REMOVED_FROM_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    label: labelSchema,
  }),
})
export type CardLabelRemovedEventAction = z.infer<typeof cardLabelRemovedEventActionSchema>
