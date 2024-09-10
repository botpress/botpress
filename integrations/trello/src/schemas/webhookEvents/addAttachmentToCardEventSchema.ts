import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const addAttachmentToCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('addAttachmentToCard').describe('Type of the action'),
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
            attachment: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the attachment'),
                name: z.string().describe('Name of the attachment'),
                url: z.string().url().optional().describe('URL of the attachment'),
                previewUrl: z.string().url().optional().describe('URL of the attachment preview'),
                previewUrl2x: z.string().url().optional().describe('URL of the attachment preview in 2x'),
              })
              .describe('Attachment that was added to the card'),
          }),
        })
        .describe('Action that is triggered when an attachment is added to a card')
    ),
  })
)
