import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { conversationSourceSchema, webhookNotificationSchema } from 'src/misc/schemas'
import { z } from '@botpress/sdk'

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = bp.HandlerProps
export type IntegrationCtx = bp.Context
export type Logger = bp.Logger

export type Client = bp.Client
export type Conversation = bp.ClientResponses['getConversation']['conversation']
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

export type VerifyResult =
  | { result: 'success'; isError: false; parsedNotification: z.infer<typeof webhookNotificationSchema> }
  | { result: 'error'; isError: true; message: string }
  | { result: 'ignore'; isError: false; message?: string }

export type IntercomMessage = z.infer<typeof conversationSourceSchema>
