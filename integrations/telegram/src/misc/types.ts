import * as sdk from '@botpress/sdk'
import * as Typegram from 'telegraf/typings/core/types/typegram'
import * as bp from '.botpress'

export type Card = bp.channels.channel.card.Card
export type TelegramMessage = Typegram.Message
export type MessageTypes = keyof typeof bp.channels.channel
export type BotpressMessage<T extends MessageTypes = MessageTypes> = T extends MessageTypes
  ? {
      type: T
      payload: bp.channels.channel.Messages[T]
    }
  : never

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
