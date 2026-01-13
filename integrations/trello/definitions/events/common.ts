import { z } from '@botpress/sdk'
import { boardSchema, memberSchema, trelloIdSchema } from '../schemas'

export enum TrelloEventType {
  // ---- Card Events ----
  CARD_CREATED = 'createCard',
  CARD_UPDATED = 'updateCard',
  CARD_DELETED = 'deleteCard',
  VOTE_ON_CARD = 'voteOnCard',
  // ---- Card Comment Events ----
  CARD_COMMENT_ADDED = 'commentCard',
  CARD_COMMENT_UPDATED = 'updateComment',
  CARD_COMMENT_DELETED = 'deleteComment',
  // ---- Card Label Events ----
  LABEL_ADDED_TO_CARD = 'addLabelToCard',
  LABEL_REMOVED_FROM_CARD = 'removeLabelFromCard',
  // ---- Card Attachment Events ----
  ATTACHMENT_ADDED_TO_CARD = 'addAttachmentToCard',
  ATTACHMENT_REMOVED_FROM_CARD = 'deleteAttachmentFromCard',
  // ---- Checklist Events ----
  CHECKLIST_ITEM_CREATED = 'createCheckItem',
  CHECKLIST_ITEM_UPDATED = 'updateCheckItem',
  CHECKLIST_ITEM_DELETED = 'deleteCheckItem',
  CHECKLIST_ITEM_STATUS_UPDATED = 'updateCheckItemStateOnCard',
  // ---- Member Events ----
  MEMBER_ADDED_TO_CARD = 'addMemberToCard',
  MEMBER_REMOVED_FROM_CARD = 'removeMemberFromCard',
}

type IdAndNameSchema = z.ZodObject<{ id: z.ZodString; name: z.ZodString }>
export const pickIdAndName = <T extends IdAndNameSchema>(schema: T) => schema.pick({ id: true, name: true })

export const genericWebhookEventSchema = z.object({
  action: z.object({
    id: trelloIdSchema.title('Action ID').describe('Unique identifier of the action'),
    idMemberCreator: memberSchema.shape.id.describe('Unique identifier of the member who initiated the action'),
    type: z.nativeEnum(TrelloEventType).title('Action Type').describe('Type of the action'),
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

export type AllSupportedEvents = (typeof TrelloEventType)[keyof typeof TrelloEventType]
export type GenericWebhookEvent = Omit<z.infer<typeof genericWebhookEventSchema>, 'action'> & {
  action: Omit<z.infer<typeof genericWebhookEventSchema.shape.action>, 'type'> & { type: AllSupportedEvents }
}
