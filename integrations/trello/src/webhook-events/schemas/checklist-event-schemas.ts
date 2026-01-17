import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { checklistSchema } from 'definitions/events/checklist-events'
import { dueReminderSchema, pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloWebhookSchema } from './common'

const _checklistItemCompletionStateSchema = z.union([z.literal('complete'), z.literal('incomplete')])

const _basicChecklistItemSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
  state: _checklistItemCompletionStateSchema,
  textData: z.object({
    emoji: z.object({}),
  }),
})

export const checklistAddedToCardWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: checklistSchema,
  }),
})
export type ChecklistAddedToCardWebhook = z.infer<typeof checklistAddedToCardWebhookSchema>

export const checklistItemCreatedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_CREATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemCreatedWebhook = z.infer<typeof checklistItemCreatedWebhookSchema>

export const checklistItemUpdatedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: checklistSchema,
    checkItem: _basicChecklistItemSchema.extend({
      dueReminder: dueReminderSchema.optional(),
      // Technically optional, if I include the "updateCheckItemDue" event type. Otherwise, it isn't included in "CHECKLIST_ITEM_UPDATED" event
      due: z.string().datetime().optional(),
    }),
    old: _basicChecklistItemSchema.omit({ id: true }).partial().extend({
      dueReminder: dueReminderSchema.optional(),
      // Technically optional, if I include the "updateCheckItemDue" event type. Otherwise, it isn't included in "CHECKLIST_ITEM_UPDATED" event
      due: z.string().datetime().optional(),
    }),
  }),
})
export type ChecklistItemUpdatedWebhook = z.infer<typeof checklistItemUpdatedWebhookSchema>

export const checklistItemDeletedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemDeletedWebhook = z.infer<typeof checklistItemDeletedWebhookSchema>

export const checklistItemStatusUpdatedWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemStatusUpdatedWebhook = z.infer<typeof checklistItemStatusUpdatedWebhookSchema>
