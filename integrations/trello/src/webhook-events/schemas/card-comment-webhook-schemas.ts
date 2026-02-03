/** NOTE: The "brands" are only for documentation purposes, since Trello
 *  is very inconsistent with the data structures for the comment events */
import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloWebhookSchema } from './common'

export const commentAddedWebhookSchema = trelloWebhookSchema.extend({
  /** @remark This is only the comment ID for the comment added event */
  id: trelloIdSchema.brand('EventID').brand('CommentID'),
  type: z.literal(TrelloEventType.CARD_COMMENT_CREATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: pickIdAndName(listSchema),
    card: pickIdAndName(cardSchema),
    text: z.string().brand('CommentText'),
  }),
})
export type CommentAddedWebhook = z.infer<typeof commentAddedWebhookSchema>

export const commentUpdatedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CARD_COMMENT_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    action: z.object({
      id: trelloIdSchema.brand('CommentID'),
      text: z.string().brand('NewCommentText'),
    }),
    old: z.object({
      text: z.string().brand('OldCommentText'),
    }),
  }),
})
export type CommentUpdatedWebhook = z.infer<typeof commentUpdatedWebhookSchema>

export const commentDeletedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CARD_COMMENT_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    action: z.object({
      id: trelloIdSchema.brand('CommentID'),
    }),
  }),
})
export type CommentDeletedWebhook = z.infer<typeof commentDeletedWebhookSchema>
