/* eslint-disable @typescript-eslint/no-var-requires */
import { schema } from '@bpinternal/opapi'
import z from 'zod'

type MessageType =
  | 'audio'
  | 'card'
  | 'carousel'
  | 'choice'
  | 'dropdown'
  | 'file'
  | 'image'
  | 'location'
  | 'text'
  | 'video'

type BpSdk = {
  messages: {
    defaults: Record<
      MessageType,
      {
        schema: z.AnyZodObject
      }
    >
    markdown: { schema: z.AnyZodObject }
  }
}

/**
 * lib "@botpress/sdk" uses "@bpinternal/zui"
 * which is incompatible with "@bpinternal/opapi"
 */
const { messages } = require('@botpress/sdk') as BpSdk

export const messagePayloadSchema = z.union([
  messages.defaults.audio.schema.extend({ type: z.literal('audio') }),
  messages.defaults.card.schema.extend({ type: z.literal('card') }),
  messages.defaults.carousel.schema.extend({ type: z.literal('carousel') }),
  messages.defaults.choice.schema.extend({ type: z.literal('choice') }),
  messages.defaults.dropdown.schema.extend({ type: z.literal('dropdown') }),
  messages.defaults.file.schema.extend({ type: z.literal('file') }),
  messages.defaults.image.schema.extend({ type: z.literal('image') }),
  messages.defaults.location.schema.extend({ type: z.literal('location') }),
  messages.defaults.text.schema.extend({ type: z.literal('text') }),
  messages.defaults.video.schema.extend({ type: z.literal('video') }),
  messages.markdown.schema.extend({ type: z.literal('markdown') }),
])

export const messageSchema = schema(
  z.object({
    id: schema(z.string(), {
      description: 'Identifier of the [Message](#schema_message)',
    }),
    createdAt: schema(z.date(), {
      description: 'Creation date of the [Message](#schema_message) in ISO 8601 format',
    }),
    payload: schema(messagePayloadSchema, {
      description: 'Payload is the content type of the message.',
    }),
    userId: schema(z.string(), { description: 'ID of the [User](#schema_user)' }),
    conversationId: schema(z.string(), { description: 'ID of the [Conversation](#schema_conversation)' }),
  }),
  {
    description:
      'The Message object represents a message in a [Conversation](#schema_conversation) for a specific [User](#schema_user).',
  }
)
