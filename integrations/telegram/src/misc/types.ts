import * as sdk from '@botpress/sdk'
import * as Typegram from 'telegraf/typings/core/types/typegram'
import * as bp from '.botpress'

export type TelegramMessage = Typegram.Message

export type Card = bp.channels.channel.card.Card

export type ValueOf<T> = T[keyof T]

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = Parameters<Handler>[0]
export type IntegrationCtx = HandlerProps['ctx']
export type Logger = HandlerProps['logger']

export type Client = bp.Client
export type Conversation = Awaited<ReturnType<Client['getConversation']>>['conversation']
export type Message = Awaited<ReturnType<Client['getMessage']>>['message']
export type User = Awaited<ReturnType<Client['getUser']>>['user']
export type Event = Awaited<ReturnType<bp.Client['getEvent']>>['event']

export type EventDefinition = NonNullable<sdk.IntegrationDefinitionProps['events']>[string]
export type ActionDefinition = NonNullable<sdk.IntegrationDefinitionProps['actions']>[string]
export type ChannelDefinition = NonNullable<sdk.IntegrationDefinitionProps['channels']>[string]

export type Action = ValueOf<bp.IntegrationProps['actions']>
export type ActionProps = Parameters<Action>[0]

export type Channel = ValueOf<bp.IntegrationProps['channels']>
export type MessageHandler = ValueOf<Channel['messages']>
export type MessageHandlerProps = Parameters<MessageHandler>[0]
export type AckFunction = MessageHandlerProps['ack']

export type MessageTypes = keyof typeof bp.channels.channel
export type BotpressMessage<T extends MessageTypes = MessageTypes> = T extends MessageTypes
  ? {
      type: T
      payload: bp.channels.channel.Messages[T]
    }
  : never
