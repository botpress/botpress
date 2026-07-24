import { z } from 'zod'
import { message, event } from './models'

export const signalSchemas = {
  messageCreated: z.object({
    type: z.literal('message_created'),
    data: message.messageSchema.extend({
      isBot: z.boolean().describe('Whether the message was created by the bot or not'),
    }),
  }),
  messageStreamDelta: z.object({
    type: z.literal('message_stream_delta'),
    data: z.object({
      streamId: z.string(),
      conversationId: z.string(),
      userId: z.string(),
      createdAt: z.string(),
      clientMessageId: z.string().optional(),
      sequence: z.number(),
      delta: z.string(),
    }),
  }),
  messageStreamComplete: z.object({
    type: z.literal('message_stream_complete'),
    data: z.object({
      streamId: z.string(),
      message: message.messageSchema,
    }),
  }),
  messageStreamAbort: z.object({
    type: z.literal('message_stream_abort'),
    data: z.object({
      streamId: z.string(),
      conversationId: z.string(),
    }),
  }),
  eventCreated: z.object({
    type: z.literal('event_created'),
    data: event.eventSchema.omit({ id: true }).extend({
      id: z.string().nullable(),
      isBot: z.boolean().describe('Whether the event was created by the bot or not'),
    }),
  }),
  participantAdded: z.object({
    type: z.literal('participant_added'),
    data: z.object({
      conversationId: z.string(),
      participantId: z.string(),
    }),
  }),
  participantRemoved: z.object({
    type: z.literal('participant_removed'),
    data: z.object({
      conversationId: z.string(),
      participantId: z.string(),
    }),
  }),
  messageDeleted: z.object({
    type: z.literal('message_deleted'),
    data: z.object({
      id: z.string(),
      conversationId: z.string(),
      userId: z.string(),
    }),
  }),
}
