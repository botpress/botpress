import { ChannelContent, ChannelMessage, ChannelToFrom, MessageSendResponse } from '@vonage/server-sdk'
import { VonageClient } from './client'

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

export type VonageChannelContent = ChannelContent
export interface MessageOption {
  label: string
  value: string
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
}
