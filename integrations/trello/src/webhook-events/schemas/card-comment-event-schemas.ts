/** NOTE: The "brands" are only for documentation purposes, since Trello
 *  is very inconsistent with the data structures for the comment events */
import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { baseEventActionSchema } from './common'

export const commentAddedEventSchema = baseEventActionSchema.extend({
  /** @remark This is only the comment ID for the comment added event */
  id: trelloIdSchema.brand('EventID').brand('CommentID'),
  type: z.literal(TrelloEventType.CARD_COMMENT_ADDED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: pickIdAndName(listSchema),
    card: pickIdAndName(cardSchema),
    text: z.string().brand('CommentText'),
  }),
})
export type CommentAddedEvent = z.infer<typeof commentAddedEventSchema>

export const commentUpdatedEventSchema = baseEventActionSchema.extend({
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
export type CommentUpdatedEvent = z.infer<typeof commentUpdatedEventSchema>

export const commentDeletedEventSchema = baseEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_COMMENT_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    action: z.object({
      id: trelloIdSchema.brand('CommentID'),
    }),
  }),
})
export type CommentDeletedEvent = z.infer<typeof commentDeletedEventSchema>
