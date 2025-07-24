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

export type SendMessageProps = Pick<MessageHandlerProps, 'client' | 'ctx' | 'conversation' | 'ack'>

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

export const messengerPayloadSchema = z.object({
  object: z.literal('page'),
  entry: z.array(messengerEntrySchema),
})
