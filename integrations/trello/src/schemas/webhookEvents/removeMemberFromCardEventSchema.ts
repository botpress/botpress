import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const removeMemberFromCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('removeMemberFromCard').describe('Type of the action'),
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
            member: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the member'),
                name: z.string().describe('Full name of the member'),
              })
              .describe('Member that was removed from the card'),
          }),
        })
        .describe('Action that is triggered when a member is removed from a card')
    ),
  })
)
