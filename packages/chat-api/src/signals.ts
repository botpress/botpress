import { z } from 'zod'
import { message, event } from './models'
import { conversationSchema } from './models/conversation'
import { messageSchema } from './models/message'
import { userSchema } from './models/user'

export const signalSchemas = {
  messageCreated: z.object({
    type: z.literal('message_created'),
    data: message.messageSchema.extend({
      isBot: z.boolean().describe('Whether the message was created by the bot or not'),
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
  initialized: z.object({
    type: z.literal('init'),
    data: z.object({
      conversation: conversationSchema,
      messages: z.array(messageSchema),
      participants: z.array(userSchema),
      user: userSchema.extend({
        userKey: z.string(),
      }),
    }),
  }),
}
