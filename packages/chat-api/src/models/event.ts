import { schema } from '@bpinternal/opapi'
import z from 'zod'

export const eventPayloadSchema = schema(z.record(z.any()), {
  description: 'Payload is the content of the custom event.',
  additionalProperties: {
    nullable: undefined, // fixes a weird issue with opapi zod to json conversion conversion
  },
})

export const eventSchema = schema(
  z.object({
    id: schema(z.string(), { description: 'ID of the custom [Event](#schema_event).' }),
    createdAt: schema(z.date(), {
      description: 'Creation date of the custom [Event](#schema_event) in ISO 8601 format',
    }),
    payload: eventPayloadSchema,
    conversationId: schema(z.string(), { description: 'ID of the [Conversation](#schema_conversation).' }),
    userId: schema(z.string(), { description: 'ID of the [User](#schema_user).' }),
  })
)
