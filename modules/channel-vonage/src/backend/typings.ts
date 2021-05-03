import {
  ChannelContent,
  ChannelMessage,
  ChannelToFrom,
  MessageSendResponse,
  MessageSendError,
  ChannelWhatsApp
} from '@vonage/server-sdk'
import { VonageClient } from './client'
import { Components } from './templates'

export interface Clients {
  [botId: string]: VonageClient
}

export interface VonageRequestBody extends MessageSendResponse {
  to: ChannelToFrom
  from: ChannelToFrom
  message: ChannelMessage
  timestamp: string
}

type Policy = ChannelWhatsApp['policy']
export interface TemplateLanguage {
  policy: Policy
  code: string
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

export type VonageChannelContent = ChannelContent & {
  custom?: ChannelContentCustomTemplate
}
export interface MessageOption {
  label: string
  value: string
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
}

interface InvalidParameter {
  name: string
  reason: string
}

export interface MessageApiError extends MessageSendError {
  invalid_parameters?: InvalidParameter[]
}

// https://developer.nexmo.com/messages/concepts/signed-webhooks#signed-jwt-payload
export interface SignedJWTPayload {
  iat: number
  jti: string
  iss: 'Vonage'
  payload_hash: string
  api_key: string
}
