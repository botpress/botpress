import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, memberSchema, trelloIdSchema } from '../schemas'

export const TRELLO_EVENTS = {
  addMemberToCard: 'addMemberToCard',
  commentCard: 'commentCard',
  createCard: 'createCard',
  deleteCard: 'deleteCard',
  removeMemberFromCard: 'removeMemberFromCard',
  updateCard: 'updateCard',
  updateCheckItemStateOnCard: 'updateCheckItemStateOnCard',
  addLabelToCard: 'addLabelToCard',
  createCheckItem: 'createCheckItem',
  deleteCheckItem: 'deleteCheckItem',
  deleteComment: 'deleteComment',
  removeLabelFromCard: 'removeLabelFromCard',
  updateCheckItem: 'updateCheckItem',
  updateComment: 'updateComment',
  voteOnCard: 'voteOnCard',
  addAttachmentToCard: 'addAttachmentToCard',
  deleteAttachmentFromCard: 'deleteAttachmentFromCard',
} as const

type IdAndNameSchema = z.ZodObject<{ id: z.ZodString; name: z.ZodString }>
const _pickIdAndName = <T extends IdAndNameSchema>(schema: T) => schema.pick({ id: true, name: true })

export const genericWebhookEventSchema = z.object({
  action: z.object({
    id: trelloIdSchema.title('Action ID').describe('Unique identifier of the action'),
    idMemberCreator: memberSchema.shape.id.describe('Unique identifier of the member who initiated the action'),
    type: z
      .string()
      .refine((e) => Reflect.ownKeys(TRELLO_EVENTS).includes(e))
      .title('Action Type')
      .describe('Type of the action'),
    date: z.string().datetime().describe('Date of the action'),
    data: z.any(),
    memberCreator: z
      .object({
        id: memberSchema.shape.id.describe('Unique identifier of the member'),
        fullName: memberSchema.shape.fullName.describe('Full name of the member'),
        username: memberSchema.shape.username.describe('Username of the member'),
        initials: z.string().describe('Initials of the member'),
        avatarHash: z.string().describe('Avatar hash of the member'),
        avatarUrl: z.string().describe('Avatar URL of the member'),
      })
      .describe('Member who initiated the action'),
  }),
  model: z.object({
    id: boardSchema.shape.id.describe('Unique identifier of the model that is being watched'),
  }),
  webhook: z.object({
    id: trelloIdSchema.describe('Unique identifier of the webhook'),
    idModel: boardSchema.shape.id.describe('Unique identifier of the model that is being watched'),
    active: z.boolean().describe('Whether the webhook is active'),
    consecutiveFailures: z.number().min(0).describe('Number of consecutive failures'),
  }),
})

export type AllSupportedEvents = keyof typeof TRELLO_EVENTS
export type GenericWebhookEvent = Omit<z.infer<typeof genericWebhookEventSchema>, 'action'> & {
  action: Omit<z.infer<typeof genericWebhookEventSchema.shape.action>, 'type'> & { type: AllSupportedEvents }
}

// Action that is triggered when an attachment is added to a card
export const addAttachmentToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('addAttachmentToCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      attachment: z
        .object({
          id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
          name: z.string().title('Attachment Name').describe('Name of the attachment'),
          url: z.string().url().optional().title('Attachment URL').describe('URL of the attachment'),
          previewUrl: z
            .string()
            .url()
            .optional()
            .title('Attachment Preview URL')
            .describe('URL of the attachment preview'),
          previewUrl2x: z
            .string()
            .url()
            .optional()
            .title('Attachment Preview URL 2x')
            .describe('URL of the attachment preview at up to 2x the resolution'),
        })
        .title('Attachment')
        .describe('Attachment that was added to the card'),
    }),
  }),
})

// Action that is triggered when a user votes on a card
export const voteOnCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('voteOnCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).optional().title('Card').describe('Card that was updated'),
      voted: z.boolean().title('Has Voted').describe('Whether the user voted on the card'),
    }),
  }),
})

// Action that is triggered when a comment is updated
export const updateCommentEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('updateComment').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      action: z
        .object({
          id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment that was updated'),
          text: z.string().title('Comment Text').describe('New text of the comment'),
        })
        .title('Action')
        .describe('The action details for the updated comment'),
      old: z
        .object({
          text: z.string().title('Old Comment Text').describe('Old text of the comment'),
        })
        .title('Old Comment')
        .describe('The previous data of the comment'),
    }),
  }),
})

// Action that is triggered when a checklist item's state is changed from "incomplete" to "complete" or vice versa
export const updateCheckItemStateOnCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('updateCheckItemStateOnCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
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

// Action that is triggered when an item is updated in a checklist
export const updateCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('updateCheckItem').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
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

// Action that is triggered when a card is updated
export const updateCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('updateCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
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
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
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

// Action that is triggered when a member is removed from a card
export const removeMemberFromCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('removeMemberFromCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      member: z
        .object({
          id: trelloIdSchema.title('Member ID').describe('Unique identifier of the member'),
          name: z.string().title('Member Name').describe('Full name of the member'),
        })
        .title('Member')
        .describe('Member that was removed from the card'),
    }),
  }),
})

// Action that is triggered when a label is removed from a card
export const removeLabelFromCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('removeLabelFromCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was modified'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
      label: z
        .object({
          id: trelloIdSchema.title('Label ID').describe('Unique identifier of the label'),
          name: z.string().title('Label Name').describe('Name of the label'),
          color: z.string().title('Label Color').describe('Color of the label'),
        })
        .title('Label')
        .describe('Label that was removed from the card'),
    }),
  }),
})

// Action that is triggered when a comment is deleted from a card
export const deleteCommentEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('deleteComment').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      action: z
        .object({
          id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment that was deleted'),
        })
        .title('Action')
        .describe('The action details for the deleted comment'),
    }),
  }),
})

// Action that is triggered when an item is removed from a checklist
export const deleteCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('deleteCheckItem').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
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

// Action that is triggered when a card is deleted
export const deleteCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('deleteCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was deleted'),
      card: cardSchema.pick({ id: true }).title('Card').describe('Card that was deleted'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was deleted'),
    }),
  }),
})

// Action that is triggered when an attachment is deleted from a card
export const deleteAttachmentFromCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('deleteAttachmentFromCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      attachment: z
        .object({
          id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
          name: z.string().title('Attachment Name').describe('Name of the attachment'),
        })
        .title('Attachment')
        .describe('Attachment that was deleted from the card'),
    }),
  }),
})

// Action that is triggered when a new item is added to a checklist
export const createCheckItemEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('createCheckItem').title('Action Type').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
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

// Action that is triggered when a card is created
export const createCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('createCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was created'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was created'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was created'),
    }),
  }),
})

// Action that is triggered when a new comment is added to a card
export const commentCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('commentCard').title('Action Type').describe('Type of the action'),
    id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
      list: _pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
      text: z.string().title('Text').describe('Text of the comment'),
    }),
  }),
})

export type CommentCardEvent = z.infer<typeof commentCardEventSchema>

// Action that is triggered when a member is added to a card
export const addMemberToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('addMemberToCard').title('Action Type').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that the member was added to'),
      member: memberSchema.title('Member').describe('Member that was added to the card'),
    }),
  }),
})

// Action that is triggered when a label is added to a card
export const addLabelToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('addLabelToCard').title('Action Type').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was modified'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was modified'),
      label: z
        .object({
          id: trelloIdSchema.title('Label ID').describe('Unique identifier of the label'),
          name: z.string().title('Label Name').describe('Name of the label'),
          color: z.string().title('Label Color').describe('Color of the label'),
        })
        .title('Label')
        .describe('Label that was added to the card'),
    }),
  }),
})

// Action that is triggered when a member is added to a card
export const addChecklistToCardEventSchema = genericWebhookEventSchema.extend({
  action: genericWebhookEventSchema.shape.action.extend({
    type: z.literal('addChecklistToCard').describe('Type of the action'),
    data: z.object({
      board: _pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
      card: _pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
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
