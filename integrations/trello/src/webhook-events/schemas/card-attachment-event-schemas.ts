import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { trelloEventActionSchema } from './common'

export const cardAttachmentAddedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.ATTACHMENT_ADDED_TO_CARD),
  data: z.object({}),
})
export type CardAttachmentAddedEventAction = z.infer<typeof cardAttachmentAddedEventActionSchema>

export const cardAttachmentRemovedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD),
  data: z.object({}),
})
export type CardAttachmentRemovedEventAction = z.infer<typeof cardAttachmentRemovedEventActionSchema>
