import { z } from 'zod'

export const triggerSchema = z.object({ type: z.literal('trigger'), payload: z.record(z.any()) })
const messageSchema = z.object({ type: z.custom<Exclude<string, 'trigger'>>() }).passthrough()

const newMessageSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
  channel: z.literal('messaging'),
  message: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    authorId: z.string().uuid().optional(),
    sentOn: z.string(),
    payload: triggerSchema.or(messageSchema),
  }),
})

export type NewMessage = z.infer<typeof newMessageSchema>
export type Trigger = z.infer<typeof triggerSchema>

const newUserSchema = z.object({
  userId: z.string().uuid(),
  userData: z.record(z.string()).optional(),
})

const updatedUserSchema = newUserSchema

export type NewUser = z.infer<typeof newUserSchema>

const newConversationSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
})

const conversationStartedSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
})

export type ConversationStarted = z.infer<typeof conversationStartedSchema>

export const incomingEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message.new'),
    data: newMessageSchema,
  }),
  z.object({
    type: z.literal('user.new'),
    data: newUserSchema,
  }),
  z.object({
    type: z.literal('user.updated'),
    data: updatedUserSchema,
  }),
  z.object({
    type: z.literal('conversation.new'),
    data: newConversationSchema,
  }),
  z.object({
    type: z.literal('conversation.started'),
    data: conversationStartedSchema,
  }),
])
