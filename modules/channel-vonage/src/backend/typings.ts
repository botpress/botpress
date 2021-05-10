import Vonage, {
  ChannelContent,
  ChannelMessage,
  ChannelToFrom,
  MessageSendResponse,
  MessageSendError,
  ChannelWhatsApp,
  ChannelContentVideo,
  ChannelMessageType
} from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'
import { ChannelContext } from 'common/channel'
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

type Policy = ChannelWhatsApp['policy']
export interface TemplateLanguage {
  policy: Policy
  code: string
}

type Parameter =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'payload'
      payload: string
    }
  | {
      type: 'image'
      image: {
        link: string
      }
    }
export type Parameters = Parameter[]

interface Header {
  type: 'header'
  parameters: Parameters
}

interface Body {
  type: 'body'
  parameters: Parameters
}

type ButtonSubType = 'quick_reply' | 'url'
export type Buttons = { subType: ButtonSubType; parameters: Parameters }[]

interface Button {
  type: 'button'
  sub_type: ButtonSubType
  index: number
  parameters: Parameters
}

export type Components = (Header | Body | Button)[]

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

interface ExtendedChannelContentVideo extends ChannelContentVideo {
  caption?: string
}

export type ExtendedChannelMessageType = ChannelMessageType | 'location'
export interface ExtendedChannelContent extends Omit<ChannelContent, 'type'> {
  type: ExtendedChannelMessageType
  // **Note: content received does not fit with Vonage API documentation. This is the proper typing**
  location?: {
    long: number
    lat: number
  }
  video?: ExtendedChannelContentVideo
}

export type VonageContext = ChannelContext<Vonage> & {
  messages: VonageChannelContent[]
  botPhoneNumber: string
  prepareIndexResponse(event: sdk.IO.OutgoingEvent, options: sdk.ChoiceOption[]): Promise<void>
  isSandbox: boolean
  debug: IDebugInstance
  logger: sdk.Logger
}
