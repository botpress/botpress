import { z } from '@botpress/sdk'
import { boardSchema, memberSchema, trelloIdSchema } from '../schemas'

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
export const pickIdAndName = <T extends IdAndNameSchema>(schema: T) => schema.pick({ id: true, name: true })

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
