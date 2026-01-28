import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = bp.HandlerProps
export type IntegrationCtx = bp.Context
export type Logger = bp.Logger

export type Client = bp.Client
export type Conversation = bp.ClientResponses['listConversations']['conversations'][number]
export type Message = bp.ClientResponses['getMessage']['message']
export type User = bp.ClientResponses['getUser']['user']
export type Event = bp.ClientResponses['getEvent']['event']

export type EventDefinition = sdk.EventDefinition
export type ActionDefinition = sdk.ActionDefinition
export type ChannelDefinition = sdk.ChannelDefinition
export type MessageDefinition = sdk.MessageDefinition

export type ActionProps = bp.AnyActionProps
export type MessageHandlerProps = bp.AnyMessageProps
export type AckFunction = bp.AnyAckFunction
export type CreateMessageInput = Parameters<Client['createMessage']>[0]
export type CreateMessageInputType = CreateMessageInput['type']
export type CreateMessageInputPayload = CreateMessageInput['payload']

export type ManualCredentials = {
  configType: 'manual'
  appId: string
  keyId: string
  keySecret: string
}
export type OAuthCredentials = {
  configType: null
  appId: string
  token: string
  subdomain?: string
}

export type StoredCredentials = ManualCredentials | OAuthCredentials

// Channel message payload types
export type Choice = bp.channels.channel.choice.Choice
export type Carousel = bp.channels.channel.carousel.Carousel
