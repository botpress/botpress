import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { genericWebhookEventSchema, pickIdAndName, TrelloEventType } from './common'

// Action that is triggered when a checklist is added to a card
export const addChecklistToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CHECKLIST_ADDED_TO_CARD).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      checklist: z
        .object({
          id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
          name: z.string().title('Checklist Name').describe('Name of the checklist'),
        })
        .title('Checklist')
        .describe('Checklist that was added to the card'),
    }),
  }),
})

// Action that is triggered when a new item is added to a checklist
export const createCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CHECKLIST_ITEM_CREATED).title('Action Type').describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      checklist: z
        .object({
          id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
          name: z.string().title('Checklist Name').describe('Name of the checklist'),
        })
        .title('Checklist')
        .describe('Checklist where the item was added'),
      checkItem: z
        .object({
          id: trelloIdSchema.title('Item ID').describe('Unique identifier of the checklist item'),
          name: z.string().title('Item Name').describe('Name of the check item'),
          state: z
            .union([z.literal('complete'), z.literal('incomplete')])
            .title('Item Status')
            .describe('The completion status of the checklist item'),
          textData: z
            .object({
              emoji: z.object({}).title('Checklist Item Emoji').describe('Emoji of the checklist item'),
            })
            .title('Text data')
            .describe('Text data of the checklist item'),
          due: z.string().datetime().optional().title('Due Date').describe('Due date of the checklist item'),
        })
        .title('Checklist Item')
        .describe('The item that was added to the checklist'),
    }),
  }),
})

// Action that is triggered when an item is updated in a checklist
export const updateCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CHECKLIST_ITEM_UPDATED).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      checklist: z
        .object({
          id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
          name: z.string().title('Checklist Name').describe('Name of the checklist'),
        })
        .title('Checklist')
        .describe('Checklist where the item was updated'),
      checkItem: z
        .object({
          id: trelloIdSchema.title('Item ID').describe('Unique identifier of the checklist item'),
          name: z.string().title('Item Name').describe('Name of the checklist item'),
          state: z
            .union([z.literal('complete'), z.literal('incomplete')])
            .title('Item Status')
            .describe('The completion status of the checklist item'),
          due: z.string().datetime().optional().title('Due Date').describe('Due date of the checklist item'),
        })
        .title('Checklist Item')
        .describe('Checklist item that was updated'),
      old: z
        .object({
          name: z.string().title('Old Item Name').describe('Old name of the checklist item'),
          state: z
            .union([z.literal('complete'), z.literal('incomplete')])
            .title('Old Item Status')
            .describe('The old completion status of the checklist item'),
          due: z.string().datetime().optional().title('Old Due Date').describe('Old due date of the checklist item'),
        })
        .title('Old Checklist Item')
        .describe('The previous data of the checklist item'),
    }),
  }),
})

// Action that is triggered when a checklist item's state is changed from "incomplete" to "complete" or vice versa
export const updateCheckItemStateOnCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      checklist: z
        .object({
          id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
          name: z.string().title('Checklist Name').describe('Name of the checklist'),
        })
        .title('Checklist')
        .describe('Checklist where the item was updated'),
      checkItem: z
        .object({
          id: trelloIdSchema.title('Item ID').describe('Unique identifier of the checklist item'),
          name: z.string().title('Item Name').describe('Name of the checklist item'),
          state: z
            .union([z.literal('complete'), z.literal('incomplete')])
            .title('Item Status')
            .describe('The completion status of the checklist item'),
          textData: z
            .object({
              emoji: z.object({}).title('Checklist Item Emoji').describe('Emoji of the checklist item'),
            })
            .title('Text data')
            .describe('Text data of the checklist item'),
          due: z.string().datetime().optional().title('Due Date').describe('Due date of the checklist item'),
        })
        .title('Checklist Item')
        .describe('Checklist item that was updated'),
    }),
  }),
})

// Action that is triggered when an item is removed from a checklist
export const deleteCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal(TrelloEventType.CHECKLIST_ITEM_DELETED).describe('Type of the action'),
    data: z.object({
      board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      checklist: z
        .object({
          id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
          name: z.string().title('Checklist Name').describe('Name of the checklist'),
        })
        .title('Checklist')
        .describe('Checklist where the item was removed'),
      checkItem: z
        .object({
          id: trelloIdSchema.title('Item ID').describe('Unique identifier of the check item'),
          name: z.string().title('Item Name').describe('Name of the check item'),
          state: z
            .union([z.literal('complete'), z.literal('incomplete')])
            .title('Item Status')
            .describe('The completion status of the checklist item'),
          textData: z
            .object({
              emoji: z.object({}).title('Checklist Item Emoji').describe('Emoji of the checklist item'),
            })
            .title('Text data')
            .describe('Text data of the checklist item'),
          due: z.string().datetime().optional().title('Due Date').describe('Due date of the check item'),
        })
        .title('Check Item')
        .describe('Check item that was removed from the checklist'),
    }),
  }),
})
