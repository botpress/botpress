import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { trelloEventActionSchema } from './common'

export const cardLabelAddedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.LABEL_ADDED_TO_CARD),
  data: z.object({}),
})
export type CardLabelAddedEventAction = z.infer<typeof cardLabelAddedEventActionSchema>

export const cardLabelRemovedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.LABEL_REMOVED_FROM_CARD),
  data: z.object({}),
})
export type CardLabelRemovedEventAction = z.infer<typeof cardLabelRemovedEventActionSchema>
