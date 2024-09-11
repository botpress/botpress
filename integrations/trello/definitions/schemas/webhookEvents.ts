import { z } from '@botpress/sdk'
import { BoardSchema, CardSchema, ListSchema, MemberSchema, TrelloIDSchema } from './entities'

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

export const genericWebhookEventSchema = z.object({
  action: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the action'),
    idMemberCreator: MemberSchema.shape.id.describe('Unique identifier of the member who initiated the action'),
    type: z
      .string()
      .refine((e) => Reflect.ownKeys(TRELLO_EVENTS).includes(e))
      .describe('Type of the action'),
    date: z.string().datetime().describe('Date of the action'),
    data: z.any(),
    memberCreator: z
      .object({
        id: MemberSchema.shape.id.describe('Unique identifier of the member'),
        fullName: MemberSchema.shape.fullName.describe('Full name of the member'),
        username: MemberSchema.shape.username.describe('Username of the member'),
        initials: z.string().describe('Initials of the member'),
        avatarHash: z.string().describe('Avatar hash of the member'),
        avatarUrl: z.string().describe('Avatar URL of the member'),
      })
      .describe('Member who initiated the action'),
  }),
  model: z.object({
    id: BoardSchema.shape.id.describe('Unique identifier of the model that is being watched'),
  }),
  webhook: z.object({
    id: TrelloIDSchema.describe('Unique identifier of the webhook'),
    idModel: BoardSchema.shape.id.describe('Unique identifier of the model that is being watched'),
    active: z.boolean().describe('Whether the webhook is active'),
    consecutiveFailures: z.number().min(0).describe('Number of consecutive failures'),
  }),
})

export type allSupportedEvents = keyof typeof TRELLO_EVENTS
export type genericWebhookEvent = Omit<z.infer<typeof genericWebhookEventSchema>, 'action'> & {
  action: Omit<z.infer<typeof genericWebhookEventSchema.shape.action>, 'type'> & { type: allSupportedEvents }
}

export const addAttachmentToCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('addAttachmentToCard').describe('Type of the action'),
          data: z.object({
            board: z
              .object({
                id: BoardSchema.shape.id.describe('Unique identifier of the board'),
                name: BoardSchema.shape.name.describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was updated'),
            card: z
              .object({
                id: CardSchema.shape.id.describe('Unique identifier of the card'),
                name: CardSchema.shape.name.describe('Name of the card'),
              })
              .describe('Card that was updated'),
            list: z
              .object({
                id: ListSchema.shape.id.describe('Unique identifier of the list'),
                name: ListSchema.shape.name.describe('Name of the list'),
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

export const voteOnCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('voteOnCard').describe('Type of the action'),
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
              .optional()
              .describe('Card that was updated'),
            voted: z.boolean().describe('Whether the user voted on the card'),
          }),
        })
        .describe('Action that is triggered when a user votes on a card')
    ),
  })
)

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

export const updateCheckItemEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('updateCheckItem').describe('Type of the action'),
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
                due: z.string().datetime().optional().describe('Due date of the check item'),
              })
              .describe('Check item that was updated'),
            old: z
              .object({
                name: z.string().describe('Old name of the check item'),
                state: z
                  .union([z.literal('complete'), z.literal('incomplete')])
                  .describe('Old state of the check item'),
                due: z.string().datetime().optional().describe('Old due date of the check item'),
              })
              .describe('Old check item data'),
          }),
        })
        .describe('Action that is triggered when an item is updated in a checklist')
    ),
  })
)

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

export const removeLabelFromCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('removeLabelFromCard').describe('Type of the action'),
          data: z.object({
            board: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the board'),
                name: z.string().describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was modified'),
            card: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the card'),
                name: z.string().describe('Name of the card'),
              })
              .describe('Card that was modified'),
            label: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the label'),
                name: z.string().describe('Name of the label'),
                color: z.string().describe('Color of the label'),
              })
              .describe('Label that was removed from the card'),
          }),
        })
        .describe('Action that is triggered when a label is removed from a card')
    ),
  })
)

export const deleteCommentEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('deleteComment').describe('Type of the action'),
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
              id: TrelloIDSchema.describe('Unique identifier of the comment that was deleted'),
            }),
          }),
        })
        .describe('Action that is triggered when a comment is deleted from a card')
    ),
  })
)

export const deleteCheckItemEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('deleteCheckItem').describe('Type of the action'),
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
              .describe('Checklist where the item was removed'),
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
              .describe('Check item that was removed from the checklist'),
          }),
        })
        .describe('Action that is triggered when an item is removed from a checklist')
    ),
  })
)

export const deleteCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('deleteCard').describe('Type of the action'),
          data: z.object({
            board: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the board'),
                name: z.string().describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was deleted'),
            card: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the card'),
              })
              .describe('Card that was deleted'),
            list: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the list'),
                name: z.string().describe('Name of the list'),
              })
              .optional()
              .describe('List where the card was deleted'),
          }),
        })
        .describe('Action that is triggered when a card is deleted')
    ),
  })
)

export const deleteAttachmentFromCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('deleteAttachmentFromCard').describe('Type of the action'),
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
              })
              .describe('Attachment that was deleted from the card'),
          }),
        })
        .describe('Action that is triggered when an attachment is deleted from a card')
    ),
  })
)

export const createCheckItemEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('createCheckItem').describe('Type of the action'),
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
              .describe('Checklist where the item was added'),
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
              .describe('Check item that was added to the checklist'),
          }),
        })
        .describe('Action that is triggered when a new item si added to a checklist')
    ),
  })
)

export const createCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('createCard').describe('Type of the action'),
          data: z.object({
            board: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the board'),
                name: z.string().describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was created'),
            card: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the card'),
                name: z.string().describe('Name of the card'),
              })
              .describe('Card that was created'),
            list: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the list'),
                name: z.string().describe('Name of the list'),
              })
              .optional()
              .describe('List where the card was created'),
          }),
        })
        .describe('Action that is triggered when a card is created')
    ),
  })
)

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

export const addMemberToCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('addMemberToCard').describe('Type of the action'),
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
              .describe('Member that was added to the card'),
          }),
        })
        .describe('Action that is triggered when a member is added to a card')
    ),
  })
)

export const addLabelToCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('addLabelToCard').describe('Type of the action'),
          data: z.object({
            board: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the board'),
                name: z.string().describe('Name of the board'),
              })
              .optional()
              .describe('Board where the card was modified'),
            card: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the card'),
                name: z.string().describe('Name of the card'),
              })
              .describe('Card that was modified'),
            label: z
              .object({
                id: TrelloIDSchema.describe('Unique identifier of the label'),
                name: z.string().describe('Name of the label'),
                color: z.string().describe('Color of the label'),
              })
              .describe('Label that was added to the card'),
          }),
        })
        .describe('Action that is triggered when a label is added to a card')
    ),
  })
)

export const addChecklistToCardEventSchema = genericWebhookEventSchema.merge(
  z.object({
    action: genericWebhookEventSchema.shape.action.merge(
      z
        .object({
          type: z.literal('addChecklistToCard').describe('Type of the action'),
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
              .describe('Checklist that was added to the card'),
          }),
        })
        .describe('Action that is triggered when a member is added to a card')
    ),
  })
)
