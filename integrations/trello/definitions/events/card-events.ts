import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { genericWebhookEventSchema, pickIdAndName } from './common'

// Action that is triggered when a card is created
export const createCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('createCard').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was created'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was created'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was created'),
    }),
  }),
})

// Action that is triggered when a card is updated
export const updateCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('updateCard').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: z
        .object({
          id: trelloIdSchema.title('Card ID').describe('Unique identifier of the card'),
          name: z.string().title('Card Name').describe('Name of the card'),
          idList: trelloIdSchema
            .optional()
            .title('List ID')
            .describe('Unique identifier of the list where the card is located'),
          desc: z.string().optional().title('Card Description').describe('Description of the card'),
          idLabels: z.array(trelloIdSchema).optional().title('Label IDs').describe('Labels attached to the card'),
          pos: z.number().optional().title('Card Position').describe('Position of the card'),
          start: z
            .union([z.string().datetime(), z.null()])
            .optional()
            .title('Start Date')
            .describe('Start date of the card'),
          due: z.union([z.string().datetime(), z.null()]).optional().title('Due Date').describe('Due date of the card'),
          dueReminder: z
            .union([z.literal(-1), z.null(), z.number().min(0)])
            .optional()
            .title('Due Reminder')
            .describe('Due reminder of the card'),
          dueComplete: z.boolean().optional().title('Due Complete').describe('Whether the card is completed'),
          closed: z.boolean().optional().title('Is Closed').describe('Whether the card is archived'),
        })
        .title('Card')
        .describe('Card that was updated'),
      old: z
        .object({
          name: z.string().title('Old Card Name').describe('Previous name of the card'),
          desc: z
            .string()
            .or(z.null())
            .optional()
            .title('Old Card Description')
            .describe('Previous description of the card'),
          idList: trelloIdSchema.optional().title('Old List ID').describe('Previous list where the card was'),
          idLabels: z
            .array(trelloIdSchema)
            .optional()
            .title('Old Label IDs')
            .describe('Previous labels attached to the card'),
          pos: z.number().optional().title('Old Position').describe('Previous position of the card within the list'),
          start: z
            .union([z.string().datetime(), z.null()])
            .optional()
            .title('Old Start Date')
            .describe('Previous start date of the card'),
          due: z
            .union([z.string().datetime(), z.null()])
            .optional()
            .title('Old Due Date')
            .describe('Previous due date of the card'),
          dueReminder: z
            .union([z.literal(-1), z.null(), z.number().min(0)])
            .optional()
            .title('Old Due Reminder')
            .describe('Previous due reminder of the card'),
          dueComplete: z
            .boolean()
            .optional()
            .title('Old Due Complete')
            .describe('Previous completion state of the card'),
          closed: z.boolean().optional().title('Old Is Closed').describe('Previous archive state of the card'),
        })
        .title('Old')
        .describe('Previous state of the card'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      listBefore: z
        .object({
          id: listSchema.shape.id.describe('Unique identifier of the previous list'),
          name: listSchema.shape.name.describe('Name of the previous list'),
        })
        .optional()
        .title('List Before')
        .describe('Previous list where the card was located'),
      listAfter: z
        .object({
          id: listSchema.shape.id.describe('Unique identifier of the new list'),
          name: listSchema.shape.name.describe('Name of the new list'),
        })
        .optional()
        .title('List After')
        .describe('New list where the card is now located'),
    }),
  }),
})

// Action that is triggered when a card is deleted
export const deleteCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('deleteCard').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was deleted'),
      card: cardSchema.pick({ id: true }).title('Card').describe('Card that was deleted'),
      list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was deleted'),
    }),
  }),
})

// Action that is triggered when a user votes on a card
export const voteOnCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('voteOnCard').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).optional().title('Card').describe('Card that was updated'),
      voted: z.boolean().title('Has Voted').describe('Whether the user voted on the card'),
    }),
  }),
})
