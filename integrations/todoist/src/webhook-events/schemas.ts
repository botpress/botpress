import { z } from '@botpress/sdk'

const baseEvent = z.object({
  event_name: z
    .enum(['note:added', 'item:added', 'item:completed', 'item:updated'])
    .describe('The event name for the webhook'),
  user_id: z.string().describe('The ID of the user that is the destination for the event.'),
  event_data: z.object({}).describe('The data of the event.'),
  initiator: z
    .object({
      id: z.string().describe('The ID of the user that initiated the event.'),
      email: z.string().email().describe('The email of the user that initiated the event.'),
      full_name: z.string().describe('The full name of the user that initiated the event.'),
      image_id: z.string().nullable().describe('The image ID of the user that initiated the event.'),
    })
    .describe(
      'The user that triggered the event. This may be the same user indicated in user_id or a collaborator from a shared project.'
    ),
})

export const noteEventDataSchema = z.object({
  id: z.string(),
  posted_uid: z.string(), // The ID of the user who posted the note
  item_id: z.string(),
  content: z.string(),
})

export type NoteAddedEvent = z.infer<typeof noteAddedEventSchema>
export const noteAddedEventSchema = baseEvent.extend({
  event_name: z.literal('note:added'),
  user_id: z.string(),
  event_data: noteEventDataSchema,
})

export const itemEventDataSchema = z.object({
  id: z.string(),
  user_id: z.string(), // The owner of the task
  content: z.string(),
  description: z.string(),
  priority: z.number(),
})

export type ItemAddedEvent = z.infer<typeof itemAddedEventSchema>
export const itemAddedEventSchema = baseEvent.extend({
  event_name: z.literal('item:added'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
})

export type ItemCompletedEvent = z.infer<typeof itemCompletedEventSchema>
export const itemCompletedEventSchema = baseEvent.extend({
  event_name: z.literal('item:completed'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
})

export type ItemUpdatedEvent = z.infer<typeof itemUpdatedEventSchema>
export const itemUpdatedEventSchema = baseEvent.extend({
  event_name: z.literal('item:updated'),
  user_id: z.string(),
  event_data: itemEventDataSchema,
  event_data_extra: z
    .object({
      old_item: itemEventDataSchema,
      update_intent: z.enum(['item_updated', 'item_completed', 'item_uncompleted']),
    })
    .optional(), // Only present if updated by a user (not by the system)
})

export type Event = z.infer<typeof eventSchema>
export const eventSchema = z.union([
  noteAddedEventSchema,
  itemAddedEventSchema,
  itemCompletedEventSchema,
  itemUpdatedEventSchema,
])
