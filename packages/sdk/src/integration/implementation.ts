import type { Client, Conversation, Message, User } from '@botpress/client'
import type { Server } from 'node:http'
import { Request, Response, serve } from '../serve'
import type { IntegrationContext } from './context'
import { IntegrationLogger } from './logger'
import { integrationHandler } from './server'

export type Tags = Record<string, string>

export type RegisterPayload = {
  webhookUrl: string
}

export type UnregisterPayload = {
  webhookUrl: string
}

export type WebhookPayload = {
  req: Request
}

export type ActionPayload<T, I> = {
  type: T
  input: I
}

export type CreateUserPayload = {
  tags: Tags
}

export type CreateConversationPayload = {
  channel: string
  tags: Tags
}

export type MessagePayload<P, M, C, U> = {
  payload: P
  conversation: C
  message: M
  user: U
  type: string
}

export type AckFunction = (props: { tags: Tags }) => Promise<void>

type BaseConfig = Record<string, any>
type BaseActions = Record<string, Record<'input' | 'output', any>>
type BaseChannels = Record<string, Record<string, any>>
type BaseEvents = Record<string, any>

type CommonArgs<TConfig extends BaseConfig> = {
  ctx: IntegrationContext<TConfig>
  client: Client
  logger: IntegrationLogger
}

type RegisterArgs<TConfig extends BaseConfig> = CommonArgs<TConfig> & RegisterPayload

type UnregisterArgs<TConfig extends BaseConfig> = CommonArgs<TConfig> & UnregisterPayload

type WebhookArgs<TConfig extends BaseConfig> = CommonArgs<TConfig> & WebhookPayload

type ActionArgs<TConfig extends BaseConfig, T, I> = CommonArgs<TConfig> & ActionPayload<T, I>

type CreateUserArgs<TConfig extends BaseConfig> = CommonArgs<TConfig> & CreateUserPayload

type CreateConversationArgs<TConfig extends BaseConfig> = CommonArgs<TConfig> & CreateConversationPayload

type MessageArgs<TConfig extends BaseConfig, P, M, C, U> = CommonArgs<TConfig> &
  MessagePayload<P, M, C, U> & {
    ack: AckFunction
  }

type ActionFunctions<TConfig extends BaseConfig, TActions extends BaseActions> = {
  [actionType in keyof TActions]: (
    props: ActionArgs<TConfig, actionType, TActions[actionType]['input']>
  ) => Promise<TActions[actionType]['output']>
}

type ChannelFunctions<TConfig extends BaseConfig, TChannels extends BaseChannels> = {
  [channelName in keyof TChannels]: {
    messages: {
      [messageType in keyof TChannels[channelName]]: (
        props: CommonArgs<TConfig> &
          MessageArgs<TConfig, TChannels[channelName][messageType], Message, Conversation, User>
      ) => Promise<void>
    }
  }
}

export type IntegrationImplementationProps<
  TConfig extends BaseConfig = BaseConfig,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  _TEvents extends BaseEvents = BaseEvents
> = {
  register: (props: RegisterArgs<TConfig>) => Promise<void>
  unregister: (props: UnregisterArgs<TConfig>) => Promise<void>
  handler: (props: WebhookArgs<TConfig>) => Promise<Response | void>
  createUser?: (props: CreateUserArgs<TConfig>) => Promise<Response | void>
  createConversation?: (props: CreateConversationArgs<TConfig>) => Promise<Response | void>
  actions: ActionFunctions<TConfig, TActions>
  channels: ChannelFunctions<TConfig, TChannels>
}

export class IntegrationImplementation<
  TConfig extends BaseConfig = BaseConfig,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TEvents extends BaseEvents = BaseEvents
> {
  public props: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>
  public actions: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['actions']
  public channels: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['channels']
  public register: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['register']
  public unregister: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['unregister']
  public createUser: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['createUser']
  public createConversation: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>['createConversation']
  public readonly handler: ReturnType<typeof integrationHandler>
  public readonly start: (port?: number) => Promise<Server>

  public constructor(props: IntegrationImplementationProps<TConfig, TActions, TChannels, TEvents>) {
    this.props = props
    this.actions = props.actions
    this.channels = props.channels
    this.register = props.register
    this.unregister = props.unregister
    this.createUser = props.createUser
    this.createConversation = props.createConversation
    this.handler = integrationHandler(props as IntegrationImplementationProps)
    this.start = (port?: number) => serve(this.handler, port)
  }
}
