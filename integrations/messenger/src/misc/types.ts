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

const MessengerOutMessagePostbackAttachmentSchema = z.object({
  type: z.literal('postback'),
  title: z.string(),
  payload: z.string(),
})

const MessengerOutMessageSayAttachmentSchema = z.object({
  type: z.literal('postback'),
  title: z.string(),
  payload: z.string(),
})

const MessengerOutMessageUrlAttachmentSchema = z.object({
  type: z.literal('web_url'),
  title: z.string(),
  url: z.string(),
})

export const MessengerOutMessageAttachmentSchema = z.union([
  MessengerOutMessagePostbackAttachmentSchema,
  MessengerOutMessageSayAttachmentSchema,
  MessengerOutMessageUrlAttachmentSchema,
])
export type MessengerOutMessageAttachment = z.infer<typeof MessengerOutMessageAttachmentSchema>

const MessengerMessagingSchema = z.object({
  sender: z.object({ id: z.string() }),
  recipient: z.object({ id: z.string() }),
  timestamp: z.number(),
  message: z
    .object({
      mid: z.string(),
      text: z.string().optional(),
      quick_reply: z.object({ payload: z.string() }).optional(),
      attachments: z.array(z.object({ type: z.string(), payload: z.object({ url: z.string() }) })).optional(),
    })
    .optional(),
  postback: z
    .object({
      mid: z.string(),
      payload: z.string(),
      title: z.string(),
    })
    .optional(),
})
export type MessengerMessaging = z.infer<typeof MessengerMessagingSchema>

const MessengerEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  messaging: z.tuple([MessengerMessagingSchema]),
})

export const MessengerPayloadSchema = z.object({
  object: z.literal('page'),
  entry: z.array(MessengerEntrySchema),
})
