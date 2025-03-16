import { z } from '@botpress/sdk'
import * as bp from '.botpress'

const InstagramMessageBaseSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
})

export const InstagramMessagingEntryMessageSchema = InstagramMessageBaseSchema.extend({
  message: z.object({
    mid: z.string(),
    attachments: z.array(z.object({ type: z.string(), payload: z.object({ url: z.string() }) })).optional(),
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

const InstagramEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.array(InstagramMessagingEntrySchema),
})

export const InstagramPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(InstagramEntrySchema),
})

export type InstagramPayload = z.infer<typeof InstagramPayloadSchema>
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
