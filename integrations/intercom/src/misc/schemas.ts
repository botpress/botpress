import { z } from '@botpress/sdk'

export const conversationSourceSchema = z.object({
  id: z.string(),
  author: z.object({
    id: z.string(),
    email: z.string().nullable(),
    type: z.string(),
  }),
  body: z.string().nullable(),
})

export const conversationPartSchema = conversationSourceSchema.extend({
  type: z.literal('conversation_part'),
})

export const conversationSchema = z.object({
  type: z.literal('conversation'),
  admin_assignee_id: z
    .number()
    .nullable()
    .transform((val) => (val ? val.toString() : null)),
  id: z.string(),
  source: conversationSourceSchema,
  conversation_parts: z.object({
    conversation_parts: z.array(conversationPartSchema),
  }),
})

export const pingSchema = z.object({
  type: z.literal('ping'),
})

export const webhookNotificationSchema = z.object({
  type: z.literal('notification_event'),
  topic: z.string(),
  data: z.object({
    item: z.union([conversationSchema, pingSchema]),
  }),
})
