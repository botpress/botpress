import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export type Carousel = bp.channels.channel.carousel.Carousel
export type Card = bp.channels.channel.card.Card
export type Choice = bp.channels.channel.choice.Choice
export type Dropdown = bp.channels.channel.dropdown.Dropdown
export type Location = bp.channels.channel.location.Location

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

export type SendMessageProps = Pick<
  MessageHandlerProps,
  'client' | 'ctx' | 'conversation' | 'ack' | 'logger' | 'type' | 'payload'
>

export type FacebookClientConfig = {
  accessToken: string
  pageToken?: string
  pageId: string
}

export type CommentReply = {
  message: string
  commentId: string
}

export type PostReply = {
  message: string
  postId: string
}

type MessengerOutMessagePostbackAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerOutMessageSayAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerOutMessageUrlAttachment = {
  type: 'web_url'
  title: string
  url: string
}

export type MessengerOutMessageAttachment =
  | MessengerOutMessagePostbackAttachment
  | MessengerOutMessageSayAttachment
  | MessengerOutMessageUrlAttachment

const baseMessengerMessagingEntrySchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
})

const messengerMessagingEntryMessageSchema = baseMessengerMessagingEntrySchema.extend({
  message: z.object({
    mid: z.string(),
    text: z.string().optional(),
    quick_reply: z.object({ payload: z.string() }).optional(),
    attachments: z.array(z.object({ type: z.string(), payload: z.object({ url: z.string() }) })).optional(),
  }),
})
export type MessengerMessagingEntryMessage = z.infer<typeof messengerMessagingEntryMessageSchema>

const messengerMessagingEntryPostbackSchema = baseMessengerMessagingEntrySchema.extend({
  postback: z.object({
    mid: z.string(),
    payload: z.string(),
    title: z.string(),
  }),
})
export type MessengerMessagingEntryPostback = z.infer<typeof messengerMessagingEntryPostbackSchema>

const messengerMessagingEntrySchema = z.union([
  messengerMessagingEntryMessageSchema,
  messengerMessagingEntryPostbackSchema,
])
export type MessengerMessagingEntry = z.infer<typeof messengerMessagingEntrySchema>

const messengerEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.tuple([messengerMessagingEntrySchema]),
})

// Comment event schemas
const commentChangeValueSchema = z.object({
  item: z.string(),
  verb: z.string(),
  created_time: z.number(),
  comment_id: z.string(),
  post_id: z.string(),
  parent_id: z.string(),
  message: z.string().optional(),
  from: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

// Feed event schemas
const feedChangeValueSchema = z.object({
  item: z.string(),
  verb: z.string(),
  created_time: z.number(),
  post_id: z.string(),
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  message: z.string().optional(),
  from: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  parent: z
    .object({
      id: z.string(),
      message: z.string().optional(),
    })
    .optional(),
})

const feedChangeSchema = z.object({
  field: z.string(),
  value: z.union([feedChangeValueSchema, commentChangeValueSchema]),
})

const feedEventEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  changes: z.array(feedChangeSchema),
})

export const feedEventPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(feedEventEntrySchema),
})

export type FeedChangeValue = z.infer<typeof feedChangeValueSchema>
export type CommentChangeValue = z.infer<typeof commentChangeValueSchema>
export type FeedChange = z.infer<typeof feedChangeSchema>
export type FeedEventEntry = z.infer<typeof feedEventEntrySchema>
export type FeedEventPayload = z.infer<typeof feedEventPayloadSchema>

export const messengerPayloadSchema = z.object({
  object: z.literal('page'),
  entry: z.array(messengerEntrySchema),
})
