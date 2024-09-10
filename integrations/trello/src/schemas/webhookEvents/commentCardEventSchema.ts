import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const commentCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('commentCard').describe('Type of the action'),
          id: TrelloIDSchema.describe('Unique identifier of the comment'),
          data: z.object({
            board: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the board'),
                name: z.string().describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was updated'),
            card: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the card'),
                name: z.string().describe('Name of the card'),
              })
              .describe('Card that was updated'),
            list: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the list'),
                name: z.string().describe('Name of the list'),
              })
              .optional()
              .describe('List where the card was updated'),
            text: z.string().describe('Text of the comment'),
          }),
        })
        .describe('Action that is triggered when a new comment is added to a card')
    ),
  })
)

export type CommentCardEvent = z.infer<typeof commentCardEventSchema>
