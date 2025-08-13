import { schema } from '@bpinternal/opapi'
import z from 'zod'

const NonEmptyString = z.string().min(1)

const textMessageSchema = z.object({
  type: z.literal('text'),
  text: NonEmptyString,
})

const markdownMessageSchema = z.object({
  type: z.literal('markdown'),
  markdown: NonEmptyString,
})

const imageMessageSchema = z.object({
  type: z.literal('image'),
  imageUrl: NonEmptyString,
})

const audioMessageSchema = z.object({
  type: z.literal('audio'),
  audioUrl: NonEmptyString,
})

const videoMessageSchema = z.object({
  type: z.literal('video'),
  videoUrl: NonEmptyString,
})

const fileMessageSchema = z.object({
  type: z.literal('file'),
  fileUrl: NonEmptyString,
  title: NonEmptyString.optional(),
})

const locationMessageSchema = z.object({
  type: z.literal('location'),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  title: z.string().optional(),
})

const cardMessageSchema = z.object({
  type: z.literal('card'),
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

const _optionMessageSchema = z.object({
  text: NonEmptyString,
  options: z.array(
    z.object({
      label: NonEmptyString,
      value: NonEmptyString,
    })
  ),
})

const choiceMessageSchema = _optionMessageSchema.extend({
  type: z.literal('choice'),
})

const dropdownMessageSchema = _optionMessageSchema.extend({
  type: z.literal('dropdown'),
})

const carouselMessageSchema = z.object({
  type: z.literal('carousel'),
  items: z.array(cardMessageSchema),
})

const blocMessageSchema = z.object({
  type: z.literal('bloc'),
  items: z.array(
    z.union([
      textMessageSchema,
      markdownMessageSchema,
      imageMessageSchema,
      audioMessageSchema,
      videoMessageSchema,
      fileMessageSchema,
      locationMessageSchema,
    ])
  ),
})

export const messagePayloadSchema = z.union([
  audioMessageSchema,
  cardMessageSchema,
  carouselMessageSchema,
  choiceMessageSchema,
  dropdownMessageSchema,
  fileMessageSchema,
  imageMessageSchema,
  locationMessageSchema,
  textMessageSchema,
  videoMessageSchema,
  markdownMessageSchema,
  blocMessageSchema,
]) satisfies z.ZodSchema<{ type: string }> // ensures that the type field can be used to discriminate

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
