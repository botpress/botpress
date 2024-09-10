import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const updateCheckItemStateOnCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('updateCheckItemStateOnCard').describe('Type of the action'),
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
            checklist: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the checklist'),
                name: z.string().describe('Name of the checklist'),
              })
              .describe('Checklist where the item was updated'),
            checkItem: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the check item'),
                name: z.string().describe('Name of the check item'),
                state: z.union([z.literal('complete'), z.literal('incomplete')]).describe('State of the check item'),
                textData: z.object({
                  emoji: z.object({}).describe('Emoji of the check item'),
                }),
                due: z.string().datetime().optional().describe('Due date of the check item'),
              })
              .describe('Check item that was updated'),
          }),
        })
        .describe('Action that is triggered when an item is updated in a checklist')
    ),
  })
)
