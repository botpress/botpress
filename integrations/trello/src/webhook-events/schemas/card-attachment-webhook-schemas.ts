import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloWebhookSchema } from './common'

export const cardAttachmentAddedWebhookSchema = trelloWebhookSchema.extend({
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
export type CardAttachmentAddedWebhook = z.infer<typeof cardAttachmentAddedWebhookSchema>

export const cardAttachmentRemovedWebhookSchema = trelloWebhookSchema.extend({
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
export type CardAttachmentRemovedWebhook = z.infer<typeof cardAttachmentRemovedWebhookSchema>
