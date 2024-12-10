import { schema } from '@bpinternal/opapi'
import z from 'zod'

export const conversationIdSchema = schema(z.string(), {
  description: 'Identifier of the [Conversation](#schema_conversation)',
})

export const conversationSchema = z.object({
  id: conversationIdSchema,
  createdAt: schema(z.date(), {
    description: 'Creation date of the [Conversation](#schema_conversation) in ISO 8601 format',
  }),
  updatedAt: schema(z.date(), {
    description: 'Updating date of the [Conversation](#schema_conversation) in ISO 8601 format',
  }),
})
