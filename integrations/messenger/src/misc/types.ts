import { z } from '@botpress/sdk'
import * as bp from '.botpress'

// Client credentials types
export type MetaClientConfigType = bp.Context['configurationType'] | 'oauth'
export type MetaClientCredentials = {
  userToken?: string
  pageToken?: string
  pageId?: string
  clientId: string
  clientSecret?: string
  appToken?: string
}

export type MessengerClientCredentials = {
  accessToken: string
  clientSecret?: string
  clientId: string
}

export type FacebookClientCredentials = {
  pageId: string
  pageToken: string
}

// Messenger channel types
export type Carousel = bp.channels.channel.carousel.Carousel
export type Card = bp.channels.channel.card.Card
export type Choice = bp.channels.channel.choice.Choice
export type Dropdown = bp.channels.channel.dropdown.Dropdown
export type Location = bp.channels.channel.location.Location

type Channels = bp.Integration['channels']
type MessengerMessages = Channels['channel']['messages']
type MessengerMessageHandler = MessengerMessages[keyof MessengerMessages]
type MessengerMessageHandlerProps = Parameters<MessengerMessageHandler>[0]

export type SendMessengerMessageProps = Pick<
  MessengerMessageHandlerProps,
  'client' | 'ctx' | 'conversation' | 'ack' | 'logger' | 'type' | 'payload'
>

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

// Messenger event schemas
const baseMessengerMessagingItemSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
})

const messengerMessagingItemMessageSchema = baseMessengerMessagingItemSchema.extend({
  message: z.object({
    mid: z.string(),
    text: z.string().optional(),
    quick_reply: z.object({ payload: z.string() }).optional(),
    attachments: z.array(z.object({ type: z.string(), payload: z.object({ url: z.string() }) })).optional(),
  }),
})
export type MessengerMessagingItemMessage = z.infer<typeof messengerMessagingItemMessageSchema>

const messengerMessagingItemPostbackSchema = baseMessengerMessagingItemSchema.extend({
  postback: z.object({
    mid: z.string(),
    payload: z.string(),
    title: z.string(),
  }),
})
export type MessengerMessagingItemPostback = z.infer<typeof messengerMessagingItemPostbackSchema>

const messengerMessagingItemSchema = z.union([
  messengerMessagingItemMessageSchema,
  messengerMessagingItemPostbackSchema,
])
export type MessengerMessagingItem = z.infer<typeof messengerMessagingItemSchema>

const messengerMessagingSchema = z.tuple([messengerMessagingItemSchema])
export type MessengerMessaging = z.infer<typeof messengerMessagingSchema>

// Facebook channel types
export type CommentReply = {
  message: string
  commentId: string
}

export type PostReply = {
  message: string
  postId: string
}

// Feed event schemas
const commentItemTypeSchema = z.literal('comment')
const otherItemTypesSchema = z.enum([
  'album',
  'address',
  'connection',
  'coupon',
  'event',
  'experience',
  'group',
  'group_message',
  'interest',
  'link',
  'mention',
  'milestone',
  'note',
  'page',
  'picture',
  'platform-story',
  'photo',
  'photo-album',
  'post',
  'profile',
  'question',
  'rating',
  'reaction',
  'relationship-status',
  'share',
  'status',
  'story',
  'timeline cover',
  'tag',
  'video',
])

const baseFeedChangeValueSchema = z.object({
  verb: z.string(),
  created_time: z.number(),
  post_id: z.string(),
  message: z.string().optional(),
  from: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

const commentChangeValueSchema = baseFeedChangeValueSchema.extend({
  item: commentItemTypeSchema,
  comment_id: z.string(),
  parent_id: z.string(),
})
export type CommentChangeValue = z.infer<typeof commentChangeValueSchema>

const feedChangeValueSchema = baseFeedChangeValueSchema.extend({
  item: otherItemTypesSchema,
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  parent: z
    .object({
      id: z.string(),
      message: z.string().optional(),
    })
    .optional(),
})

const feedChangeSchema = z.object({
  field: z.string(),
  value: z.discriminatedUnion('item', [commentChangeValueSchema, feedChangeValueSchema]),
})
export type FeedChange = z.infer<typeof feedChangeSchema>

const feedChangesSchema = z.array(feedChangeSchema)
export type FeedChanges = z.infer<typeof feedChangesSchema>

// Common event schemas
const baseEventEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
})

const messengerEntrySchema = baseEventEntrySchema.extend({
  messaging: messengerMessagingSchema,
})

const feedEntrySchema = baseEventEntrySchema.extend({
  changes: feedChangesSchema,
})

const eventEntrySchema = z.union([messengerEntrySchema, feedEntrySchema])

export const eventPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(eventEntrySchema),
})
