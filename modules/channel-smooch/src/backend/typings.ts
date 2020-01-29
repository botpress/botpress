import { SmoochClient } from './client'

export type Clients = { [botId: string]: SmoochClient }

export type Webhook = {
  /** Id of smooch webhook */
  _id: string
  /** A boolean specifying whether webhook payloads should include the client information associated with a conversation in webhook events. */
  includeClient: boolean
  /** A boolean specifying whether webhook payloads should include the complete appUser schema for appUser events. */
  includeFullAppUser: boolean
  /** An array of triggers you wish to have the webhook listen to. This property is case sensitive. */
  triggers: string[]
  /** Smooch secret key */
  secret: string
  /** URL to be called when the webhook is triggered. */
  target: string
  /** Smooch API version */
  version: '1.1'
}

export type MessagePayload = {
  trigger: 'message:appUser' | 'message:appMaker'
  /** A nested object representing the Sunshine Conversations app associated with the event. */
  app: { _id: string }
  /** Smooch API version */
  version: '1.1'
  /** An array of objects representing the messages associated with the event. */
  messages: Message[]
  /** A nested object representing the appUser associated with the event. */
  appUser: AppUser
  /** A nested object representing the conversation associated with the event. */
  conversation: { _id: string }
}

export type AppUser = {
  /** A canonical ID that can be used to retrieve the appUser. */
  _id: string
  /** A boolean representing of whether a message has been sent or not. */
  conversationStarted: boolean
  /** A datetime string with the format yyyy-mm-ddThh:mm:ssZ representing the moment an appUser was created. */
  signedUpAt: Date
  /** A flat object of optional properties set by the app maker. */
  properties: any
  /** An optional surname. */
  surname?: string
  /** An optional given name. */
  givenName?: string
  /** An optional email address. */
  email?: string
}

export type Message = {
  /** The unique ID for the message. */
  _id: string
  /** Message type */
  type: 'text' | 'image' | 'file' | 'carousel' | 'location' | 'list' | 'form' | 'formResponse'
  /** The message text. */
  text: string
  /** The role of the message sender. */
  role: 'appUser' | 'appMaker' | 'whisper'
  /** The appUser’s name, or an optionally provided appMaker name. */
  name: string
  /** The appUser’s _id if the message role is "appUser", otherwise, a hash based on the appMaker’s email address. */
  authorId: string
  /** A unix timestamp given in seconds, describing when Sunshine Conversations received the message. */
  received: number
  /** A nested object describing the source of the message. */
  source: {
    /**
     * An identifier for the channel from which a message originated.
     * May include one of "web", "ios", "android", "messenger", "viber", "telegram",
     * "wechat", "line", "twilio", "api", or any number of other channels.
     */
    type: string
  }
}
