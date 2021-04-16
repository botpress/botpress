import { ChannelContent, ChannelMessage, ChannelToFrom, ChannelWhatsApp, MessageSendResponse } from '@vonage/server-sdk'
import { VonageClient } from './client'
import { Components } from './template'

export class ChannelUnsupportedError extends Error {
  constructor() {
    super('Unable to process message: only Whatsapp channel is supported')
  }
}

export interface Clients {
  [botId: string]: VonageClient
}

export interface VonageRequestBody extends MessageSendResponse {
  to: ChannelToFrom
  from: ChannelToFrom
  message: ChannelMessage
  timestamp: string
}

// TODO: Remove this. For debugging purpose only
export type MessageStatus = 'delivered' | 'submitted' | 'read'
export interface VonageMessageStatusBody extends MessageSendResponse {
  to: ChannelToFrom
  from: ChannelToFrom
  message: ChannelMessage
  usage?: { price: string; currency: string }
  status: MessageStatus
  timestamp: string
}

type Policy = ChannelWhatsApp['policy']
export interface TemplateLanguage {
  policy: Policy
  code: string
}

export interface ChannelContentLocation {
  longitude: number
  latitude: number
  name: string
  address: string
}

export interface ChannelContentTemplate {
  namespace: string
  name: string
  language: TemplateLanguage
  components: Components
}

export interface ChannelContentCustomTemplate {
  type: 'template'
  template: ChannelContentTemplate
}

export interface ChannelContentCustomLocation {
  type: 'location'
  location: ChannelContentLocation
}

export type VonageChannelContent = ChannelContent & {
  custom?: ChannelContentCustomTemplate | ChannelContentCustomLocation
}

export interface MessageOption {
  label: string
  value: string
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
}
