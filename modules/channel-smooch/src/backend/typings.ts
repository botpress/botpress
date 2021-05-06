import { ChannelContext } from 'common/channel'
import { SmoochClient } from './client'

export interface Clients {
  [botId: string]: SmoochClient
}

export interface Webhook {
  _id: string
  /** Include client in payload */
  includeClient: boolean
  /** Include complete appUser in payload */
  includeFullAppUser: boolean
  /** Triggers that the webhook listens to */
  triggers: string[]
  /** Secret key generated for this webhook */
  secret: string
  /** URL to be called when the webhook is triggered */
  target: string
  version: '1.1'
}

export interface MessagePayload {
  trigger: 'message:appUser' | 'message:appMaker'
  app: { _id: string }
  version: '1.1'
  messages: Message[]
  appUser: AppUser
  conversation: { _id: string }
}

export interface AppUser {
  _id: string
  conversationStarted: boolean
  signedUpAt: Date
  properties: any
  surname?: string
  givenName?: string
  email?: string
}

export interface Message {
  _id: string
  type: 'text' | 'image' | 'file' | 'carousel' | 'location' | 'list' | 'form' | 'formResponse'
  text: string
  role: 'appUser' | 'appMaker' | 'whisper'
  name: string
  authorId: string
  /** Unix timestamp for when Sunshine Conversations received the message */
  received: number
  source: {
    /** web, messenger, telegram, wechat, twilio, etc */
    type: string
  }
}

export interface Card {
  title: string
  description: string
  actions: {
    text: string
    type: string
    uri?: string
    payload?: string
  }[]
  mediaUrl?: string
}

export type SmoochContext = ChannelContext<any> & {
  messages: any[]
}
