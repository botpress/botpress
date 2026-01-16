import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { dueReminderSchema, pickIdAndName } from 'definitions/events/common'
import { boardSchema, cardSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloEventActionSchema } from './common'

const _checklistSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
})

const _checklistItemCompletionStateSchema = z.union([z.literal('complete'), z.literal('incomplete')])

const _basicChecklistItemSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
  state: _checklistItemCompletionStateSchema,
  textData: z.object({
    emoji: z.object({}),
  }),
})

export const checklistAddedToCardEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: _checklistSchema,
  }),
})
export type ChecklistAddedToCardEventAction = z.infer<typeof checklistAddedToCardEventActionSchema>

export const checklistItemCreatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_CREATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: _checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemCreatedEventAction = z.infer<typeof checklistItemCreatedEventActionSchema>

export const checklistItemUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: _checklistSchema,
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
export type ChecklistItemUpdatedEventAction = z.infer<typeof checklistItemUpdatedEventActionSchema>

export const checklistItemDeletedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: _checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemDeletedEventAction = z.infer<typeof checklistItemDeletedEventActionSchema>

export const checklistItemStatusUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    checklist: _checklistSchema,
    checkItem: _basicChecklistItemSchema,
  }),
})
export type ChecklistItemStatusUpdatedEventAction = z.infer<typeof checklistItemStatusUpdatedEventActionSchema>
