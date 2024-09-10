import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '../primitives/trelloId'
import { genericWebhookEventSchema } from './genericWebhookEventSchema'

export const updateCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('updateCard').describe('Type of the action'),
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
                idList: TrelloIDSchema.optional().describe('Unique identifier of the list where the card is located'),
                desc: z.string().optional().describe('Description of the card'),
                idLabels: z.array(TrelloIDSchema).optional().describe('Labels attached to the card'),
                pos: z.number().optional().describe('Position of the card'),
                start: z.union([z.string().datetime(), z.null()]).optional().describe('Start date of the card'),
                due: z.union([z.string().datetime(), z.null()]).optional().describe('Due date of the card'),
                dueReminder: z
                  .union([z.literal(-1), z.null(), z.number().min(0)])
                  .optional()
                  .describe('Due reminder of the card'),
                dueComplete: z.boolean().optional().describe('Whether the card is completed'),
                closed: z.boolean().optional().describe('Whether the card is archived'),
              })
              .describe('Card that was updated'),
            old: z
              .object({
                name: z.string().describe('Previous name of the card'),
                desc: z.string().or(z.null()).optional().describe('Previous description of the card'),
                idList: TrelloIDSchema.optional().describe('Previous list where the card was'),
                idLabels: z.array(TrelloIDSchema).optional().describe('Previous labels attached to the card'),
                pos: z.number().optional().describe('Previous position of the card'),
                start: z
                  .union([z.string().datetime(), z.null()])
                  .optional()
                  .describe('Previous start date of the card'),
                due: z.union([z.string().datetime(), z.null()]).optional().describe('Previous due date of the card'),
                dueReminder: z
                  .union([z.literal(-1), z.null(), z.number().min(0)])
                  .optional()
                  .describe('Previous due reminder of the card'),
                dueComplete: z.boolean().optional().describe('Previous completion state of the card'),
                closed: z.boolean().optional().describe('Previous archive state of the card'),
              })
              .describe('Previous state of the card'),
            list: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the list'),
                name: z.string().describe('Name of the list'),
              })
              .optional()
              .describe('List where the card was updated'),
            listBefore: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the previous list'),
                name: z.string().describe('Name of the previous list'),
              })
              .optional()
              .describe('Previous list where the card was located'),
            listAfter: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the new list'),
                name: z.string().describe('Name of the new list'),
              })
              .optional()
              .describe('New list where the card is now located'),
          }),
        })
        .describe('Action that is triggered when a card is updated')
    ),
  })
)
