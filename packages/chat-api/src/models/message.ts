import { schema } from '@bpinternal/opapi'
import z from 'zod'

const NonEmptyString = z.string().min(1)

const textMessageSchema = z.object({
  text: NonEmptyString,
})

const markdownMessageSchema = z.object({
  markdown: NonEmptyString,
})

const imageMessageSchema = z.object({
  imageUrl: NonEmptyString,
})

const audioMessageSchema = z.object({
  audioUrl: NonEmptyString,
})

const videoMessageSchema = z.object({
  videoUrl: NonEmptyString,
})

const fileMessageSchema = z.object({
  fileUrl: NonEmptyString,
  title: NonEmptyString.optional(),
})

const locationMessageSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  title: z.string().optional(),
})

const cardMessageSchema = z.object({
  title: NonEmptyString,
  subtitle: NonEmptyString.optional(),
  imageUrl: NonEmptyString.optional(),
  actions: z.array(
    z.object({
      action: z.enum(['postback', 'url', 'say']),
      label: NonEmptyString,
      value: NonEmptyString,
    })
  ),
})

const choiceMessageSchema = z.object({
  text: NonEmptyString,
  options: z.array(
    z.object({
      label: NonEmptyString,
      value: NonEmptyString,
    })
  ),
})

const carouselMessageSchema = z.object({
  items: z.array(cardMessageSchema),
})

const messages = {
  text: { schema: textMessageSchema },
  image: { schema: imageMessageSchema },
  audio: { schema: audioMessageSchema },
  video: { schema: videoMessageSchema },
  file: { schema: fileMessageSchema },
  location: { schema: locationMessageSchema },
  carousel: { schema: carouselMessageSchema },
  card: { schema: cardMessageSchema },
  dropdown: { schema: choiceMessageSchema },
  choice: { schema: choiceMessageSchema },
  markdown: { schema: markdownMessageSchema },
}

export const messagePayloadSchema = z.union([
  messages.audio.schema.extend({ type: z.literal('audio') }),
  messages.card.schema.extend({ type: z.literal('card') }),
  messages.carousel.schema.extend({ type: z.literal('carousel') }),
  messages.choice.schema.extend({ type: z.literal('choice') }),
  messages.dropdown.schema.extend({ type: z.literal('dropdown') }),
  messages.file.schema.extend({ type: z.literal('file') }),
  messages.image.schema.extend({ type: z.literal('image') }),
  messages.location.schema.extend({ type: z.literal('location') }),
  messages.text.schema.extend({ type: z.literal('text') }),
  messages.video.schema.extend({ type: z.literal('video') }),
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
    metadata: schema(z.record(z.any()).optional(), { description: 'Metadata of the message' }),
  }),
  {
    description:
      'The Message object represents a message in a [Conversation](#schema_conversation) for a specific [User](#schema_user).',
  }
)
