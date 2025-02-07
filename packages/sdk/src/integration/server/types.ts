import { type Conversation, type Message, type User } from '@botpress/client'
import { Request, Response } from '../../serve'
import { Cast, Merge, ValueOf } from '../../utils/type-utils'
import { IntegrationSpecificClient } from '../client'
import { BaseIntegration, ToTags } from '../types'
import { type IntegrationLogger } from './integration-logger'

type IntegrationOperation =
  | 'webhook_received'
  | 'message_created'
  | 'action_triggered'
  | 'register'
  | 'unregister'
  | 'ping'
  | 'create_user'
  | 'create_conversation'
type IntegrationContextConfig<TIntegration extends BaseIntegration> =
  | {
      configurationType: null
      configuration: TIntegration['configuration']
    }
  | ValueOf<{
      [TConfigType in keyof TIntegration['configurations']]: {
        configurationType: TConfigType
        configuration: TIntegration['configurations'][TConfigType]
      }
    }>

export type IntegrationContext<TIntegration extends BaseIntegration = BaseIntegration> = {
  botId: string
  botUserId: string
  integrationId: string
  webhookId: string
  operation: IntegrationOperation
} & IntegrationContextConfig<TIntegration>

export type CommonHandlerProps<TIntegration extends BaseIntegration> = {
  ctx: IntegrationContext<TIntegration>
  client: IntegrationSpecificClient<TIntegration>
  logger: IntegrationLogger
}

export type RegisterPayload = { webhookUrl: string }
export type RegisterHandlerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> &
  RegisterPayload
export type RegisterHandler<TIntegration extends BaseIntegration> = (
  props: RegisterHandlerProps<TIntegration>
) => Promise<void>

export type UnregisterPayload = { webhookUrl: string }
export type UnregisterHandlerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> &
  UnregisterPayload
export type UnregisterHandler<TIntegration extends BaseIntegration> = (
  props: UnregisterHandlerProps<TIntegration>
) => Promise<void>

export type WebhookPayload = { req: Request }
export type WebhookHandlerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> &
  WebhookPayload
export type WebhookHandler<TIntegration extends BaseIntegration> = (
  props: WebhookHandlerProps<TIntegration>
) => Promise<Response | void>

export type ActionMetadata = { setCost: (cost: number) => void }
export type ActionPayload<T extends string, I> = { type: T; input: I; metadata: ActionMetadata }
export type ActionHandlerProps<
  TIntegration extends BaseIntegration,
  T extends string,
  I,
> = CommonHandlerProps<TIntegration> & ActionPayload<T, I>
export type ActionHandlers<TIntegration extends BaseIntegration> = {
  [ActionType in keyof TIntegration['actions']]: (
    props: ActionHandlerProps<TIntegration, Cast<ActionType, string>, TIntegration['actions'][ActionType]['input']>
  ) => Promise<TIntegration['actions'][ActionType]['output']>
}

export type CreateUserPayload<TIntegration extends BaseIntegration> = {
  tags: ToTags<keyof TIntegration['user']['tags']>
}
export type CreateUserHandlerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> &
  CreateUserPayload<TIntegration>
export type CreateUserHandler<TIntegration extends BaseIntegration> = (
  props: CreateUserHandlerProps<TIntegration>
) => Promise<Response | void>

export type CreateConversationPayload<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'] = keyof TIntegration['channels'],
> = {
  channel: TChannel
  tags: ToTags<keyof TIntegration['channels'][TChannel]['conversation']['tags']>
}
export type CreateConversationHandlerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> &
  CreateConversationPayload<TIntegration>
export type CreateConversationHandler<TIntegration extends BaseIntegration> = (
  props: CreateConversationHandlerProps<TIntegration>
) => Promise<Response | void>

export type MessagePayload<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages'],
> = {
  type: TMessage
  payload: TIntegration['channels'][TChannel]['messages'][TMessage]
  conversation: Merge<
    Conversation,
    {
      channel: TChannel
      tags: ToTags<keyof TIntegration['channels'][TChannel]['conversation']['tags']>
    }
  >
  message: Merge<
    Message,
    {
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags']>
    }
  >
  user: Merge<
    User,
    {
      tags: ToTags<keyof TIntegration['user']['tags']>
    }
  >
}
export type MessageHandlerProps<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages'],
> = CommonHandlerProps<TIntegration> &
  MessagePayload<TIntegration, TChannel, TMessage> & {
    ack: (props: { tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags']> }) => Promise<void>
  }
export type ChannelHandlers<TIntegration extends BaseIntegration> = {
  [ChannelName in keyof TIntegration['channels']]: {
    messages: {
      [MessageType in keyof TIntegration['channels'][ChannelName]['messages']]: (
        props: CommonHandlerProps<TIntegration> & MessageHandlerProps<TIntegration, ChannelName, MessageType>
      ) => Promise<void>
    }
  }
}

export type IntegrationHandlers<TIntegration extends BaseIntegration> = {
  register: RegisterHandler<TIntegration>
  unregister: UnregisterHandler<TIntegration>
  webhook: WebhookHandler<TIntegration>
  createUser?: CreateUserHandler<TIntegration>
  createConversation?: CreateConversationHandler<TIntegration>
  actions: ActionHandlers<TIntegration>
  channels: ChannelHandlers<TIntegration>
}
