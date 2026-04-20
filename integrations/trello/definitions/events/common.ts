import { z } from '@botpress/sdk'
import { trelloIdSchema } from '../schemas'

export enum TrelloEventType {
  // ---- Card Events ----
  CARD_CREATED = 'createCard',
  CARD_UPDATED = 'updateCard',
  CARD_DELETED = 'deleteCard',
  CARD_VOTES_UPDATED = 'voteOnCard',
  // ---- Card Comment Events ----
  CARD_COMMENT_CREATED = 'commentCard',
  CARD_COMMENT_UPDATED = 'updateComment',
  CARD_COMMENT_DELETED = 'deleteComment',
  // ---- Card Label Events ----
  LABEL_ADDED_TO_CARD = 'addLabelToCard',
  LABEL_REMOVED_FROM_CARD = 'removeLabelFromCard',
  // ---- Card Attachment Events ----
  ATTACHMENT_ADDED_TO_CARD = 'addAttachmentToCard',
  ATTACHMENT_REMOVED_FROM_CARD = 'deleteAttachmentFromCard',
  // ---- Checklist Events ----
  CHECKLIST_ADDED_TO_CARD = 'addChecklistToCard',
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

/** The number of minutes before the due date when a reminder will be sent.
 *
 *  @remark When the value is "-1", it means no due date reminder is set. */
export const dueReminderSchema = z
  .number()
  .int('Due date reminder is not an integer')
  .min(-1)
  .title('Due Date Reminder')
  .describe('The number of minutes before the due date when a reminder will be sent')

export const botpressEventDataSchema = z.object({
  eventId: trelloIdSchema.title('Event ID').describe('Unique identifier of the event'),
  actor: z
    .union([
      z.object({
        id: trelloIdSchema.title('Actor ID').describe('Unique identifier of the actor who triggered the event'),
        type: z
          .literal('member')
          .title('Actor Type')
          .describe('The type of the actor (e.g. member or app) who triggered the event'),
        name: z.string().title('Actor Name').describe('The name of the actor (e.g. member) who triggered the event'),
      }),
      z.object({
        id: trelloIdSchema.title('Actor ID').describe('Unique identifier of the actor who triggered the event'),
        type: z
          .literal('app')
          .title('Actor Type')
          .describe('The type of the actor (e.g. member or app) who triggered the event'),
      }),
    ])

    .title('Actor')
    .describe('The actor (e.g. member or app) who triggered the event'),
  dateCreated: z.string().datetime().title('Date Created').describe('The datetime when the event was triggered'),
})
export type CommonEventData = z.infer<typeof botpressEventDataSchema>
