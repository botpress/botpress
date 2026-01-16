import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloEventActionSchema } from './common'

export const cardAttachmentAddedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.ATTACHMENT_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: pickIdAndName(listSchema),
    card: pickIdAndName(cardSchema),
    attachment: z.object({
      id: trelloIdSchema,
      name: z.string(),
      url: z.string().url(),
      previewUrl: z.string().url().optional(),
      previewUrl2x: z.string().url().optional(),
    }),
  }),
})
export type CardAttachmentAddedEventAction = z.infer<typeof cardAttachmentAddedEventActionSchema>

export const cardAttachmentRemovedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    attachment: z.object({
      id: trelloIdSchema,
      name: z.string(),
    }),
  }),
})
export type CardAttachmentRemovedEventAction = z.infer<typeof cardAttachmentRemovedEventActionSchema>
