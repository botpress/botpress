import { ChannelContent, ChannelMessage, ChannelToFrom, ChannelWhatsApp, MessageSendResponse } from '@vonage/server-sdk'
import { VonageClient } from './client'

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

export interface ChannelContentLocation {
  longitude: number
  latitude: number
  name: string
  address: string
}

export interface ChannelContentCustomTemplateStructure {
  type: 'header' | 'body' | 'footer'
  parameters?: VonageChannelContent[]
}

export interface ChannelContentTemplate {
  namespace: string
  name: string
  language: ChannelWhatsApp
  components: ChannelContentCustomTemplateStructure[]
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
