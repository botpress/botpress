import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const updateCommentEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('updateComment').describe('Type of the action'),
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
            action: z.object({
              id: TrelloIDSchema.describe('Unique identifier of the comment that was updated'),
              text: z.string().describe('New text of the comment'),
            }),
            old: z
              .object({
                text: z.string().describe('Old text of the comment'),
              })
              .describe('Old comment data'),
          }),
        })
        .describe('Action that is triggered when a comment is updated')
    ),
  })
)
