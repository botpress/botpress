import { z } from '@botpress/sdk'
import * as bp from '.botpress'

const InstagramMessageBaseSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
})

const InstagramMessagingEntryAttachmentTypeSchema = z.enum([
  'audio',
  'file',
  'image',
  'share',
  'story_mention',
  'video',
  'ig_reel',
  'reel',
])
export const InstagramMessagingEntryMessageSchema = InstagramMessageBaseSchema.extend({
  message: z.object({
    mid: z.string(),
    attachments: z
      .array(z.object({ type: InstagramMessagingEntryAttachmentTypeSchema, payload: z.object({ url: z.string() }) }))
      .optional(),
    is_echo: z.boolean().optional(),
    quick_reply: z.object({ payload: z.string() }).optional(),
    text: z.string().optional(),
  }),
})

export const InstagramMessagingEntryPostbackSchema = InstagramMessageBaseSchema.extend({
  postback: z.object({
    mid: z.string(),
    title: z.string(),
    payload: z.string(),
  }),
})

const InstagramMessagingEntryOtherSchema = InstagramMessageBaseSchema

const InstagramMessagingEntrySchema = z.union([
  InstagramMessagingEntryMessageSchema,
  InstagramMessagingEntryPostbackSchema,
  InstagramMessagingEntryOtherSchema,
])

export const InstagramMessageEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.array(InstagramMessagingEntrySchema),
})

const InstagramCommentSchema = z.object({
  id: z.string(),
  parent_id: z.string().optional(),
  text: z.string(),
  from: z.object({
    id: z.string(),
    username: z.string(),
  }),
  media: z.object({
    id: z.string(),
    media_product_type: z.string(),
  }),
})

export const InstagramCommentEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  changes: z.array(
    z.object({
      field: z.string(),
      value: InstagramCommentSchema,
    })
  ),
})

// Entry-level union - allows mixed entry types in a single payload
const InstagramEntrySchema = z.union([InstagramMessageEntrySchema, InstagramCommentEntrySchema])

// Single payload schema with entry-level union
export const InstagramPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(InstagramEntrySchema),
})

// Legacy schemas for backward compatibility
export const InstagramCommentPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(InstagramCommentEntrySchema),
})

export const InstagramMessagePayloadSchema = z.object({
  object: z.string(),
  entry: z.array(InstagramMessageEntrySchema),
})

export type InstagramEntry = z.infer<typeof InstagramEntrySchema>
export type InstagramPayload = z.infer<typeof InstagramPayloadSchema>
export type InstagramCommentPayload = z.infer<typeof InstagramCommentPayloadSchema>
export type InstagramMessagePayload = z.infer<typeof InstagramMessagePayloadSchema>
export type InstagramComment = z.infer<typeof InstagramCommentSchema>
export type InstagramCommentEntry = z.infer<typeof InstagramCommentEntrySchema>
export type InstagramMessageEntry = z.infer<typeof InstagramMessageEntrySchema>
export type InstagramMessagingEntry = z.infer<typeof InstagramMessagingEntrySchema>
export type InstagramMessagingEntryPostback = z.infer<typeof InstagramMessagingEntryPostbackSchema>
export type InstagramMessagingEntryMessage = z.infer<typeof InstagramMessagingEntryMessageSchema>

export type Carousel = bp.channels.channel.carousel.Carousel
export type Card = bp.channels.channel.card.Card
export type Choice = bp.channels.channel.choice.Choice
export type Dropdown = bp.channels.channel.dropdown.Dropdown
export type Location = bp.channels.channel.location.Location

export type InstagramActionBase = { title: string }

type InstagramActionPostback = {
  type: 'postback'
  title: string
  payload: string
} & InstagramActionBase

type InstagramActionAttachment = {
  type: 'web_url'
  url: string
} & InstagramActionBase

export type InstagramAction = InstagramActionPostback | InstagramActionAttachment

export type TextMessageWithQuickReplies = {
  text: string
  quick_replies?: {
    content_type: string
    title: string
    payload: string
  }[]
}

export type GenericTemplateElement = {
  title: string
  image_url?: string
  subtitle?: string
  default_action?: InstagramAction
  buttons: InstagramAction[]
}

export type GenericTemplateMessage = {
  attachment: {
    type: 'template'
    payload: {
      template_type: 'generic'
      elements: GenericTemplateElement[]
    }
  }
}
