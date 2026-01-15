import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { trelloEventActionSchema } from './common'

export const checklistAddedToCardEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ADDED_TO_CARD),
  data: z.object({}),
})
export type ChecklistAddedToCardEventAction = z.infer<typeof checklistAddedToCardEventActionSchema>

export const checklistItemCreatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_CREATED),
  data: z.object({}),
})
export type ChecklistItemCreatedEventAction = z.infer<typeof checklistItemCreatedEventActionSchema>

export const checklistItemUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_UPDATED),
  data: z.object({}),
})
export type ChecklistItemUpdatedEventAction = z.infer<typeof checklistItemUpdatedEventActionSchema>

export const checklistItemDeletedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_DELETED),
  data: z.object({}),
})
export type ChecklistItemDeletedEventAction = z.infer<typeof checklistItemDeletedEventActionSchema>

export const checklistItemStatusUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED),
  data: z.object({}),
})
export type ChecklistItemStatusUpdatedEventAction = z.infer<typeof checklistItemStatusUpdatedEventActionSchema>
