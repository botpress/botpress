import { z } from '@botpress/sdk'

export type NoteEventData = z.infer<typeof noteEventDataSchema>
export const noteEventDataSchema = z.object({
  id: z.string(),
  posted_uid: z.string(), // The ID of the user who posted the note
  item_id: z.string(),
  content: z.string(),
})

export type NoteEvent = z.infer<typeof noteEventSchema>
export const noteEventSchema = z.object({
  event_name: z.literal('note:added'),
  user_id: z.string(),
  event_data: noteEventDataSchema,
  event_data_extra: z.undefined(),
})

export type ItemEventData = z.infer<typeof itemEventDataSchema>
export const itemEventDataSchema = z.object({
  id: z.string(),
  user_id: z.string(), // The owner of the task
  content: z.string(),
  description: z.string(),
  priority: z.number(),
})

export type ItemUpdateEventDataExtra = z.infer<typeof itemUpdateEventDataExtraSchema>
export const itemUpdateEventDataExtraSchema = z.object({
  old_item: itemEventDataSchema,
  update_intent: z.enum(['item_updated', 'item_completed', 'item_uncompleted']),
})

export type ItemAddedEvent = z.infer<typeof itemAddedEventSchema>
export const itemAddedEventSchema = z.object({
  event_name: z.literal('item:added'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
  event_data_extra: z.undefined(),
})

export type ItemCompletedEvent = z.infer<typeof itemCompletedEventSchema>
export const itemCompletedEventSchema = z.object({
  event_name: z.literal('item:completed'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
  event_data_extra: z.undefined(),
})

export type ItemUpdatedEvent = z.infer<typeof itemUpdatedEventSchema>
export const itemUpdatedEventSchema = z.object({
  event_name: z.literal('item:updated'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
  event_data_extra: itemUpdateEventDataExtraSchema.optional(), // Only present if updated by bot itself
})

export type Event = z.infer<typeof eventSchema>
export const eventSchema = z.union([
  noteEventSchema,
  itemAddedEventSchema,
  itemCompletedEventSchema,
  itemUpdatedEventSchema,
])
