import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export type Client = bp.Client
export type User = bp.ClientResponses['getUser']['user']
export type Message = bp.ClientResponses['createMessage']['message']
export type Conversation = bp.ClientResponses['getConversation']['conversation']

export type EventDefinition = sdk.EventDefinition
export type ActionDefinition = sdk.ActionDefinition
export type ChannelDefinition = sdk.ChannelDefinition
export type IntegrationCtx = bp.Context

export type RegisterFunction = bp.IntegrationProps['register']
export type UnregisterFunction = bp.IntegrationProps['unregister']
export type CreateConversationFunction = bp.IntegrationProps['createConversation']
export type CreateUserFunction = bp.IntegrationProps['createUser']
export type Channels = bp.IntegrationProps['channels']

export type AckFunction = bp.AnyAckFunction
export type IntegrationLogger = bp.Logger
