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

/**
 * Integration implementation type argument for smart intellisense and type inference
 */
type TIntegrationImplementation = {
  configuration: any
  events: Record<string, any>
  actions: Record<string, Record<'input' | 'output', any>>
  channels: Record<string, Record<string, any>>
  states: Record<string, any>
}

type CommonArgs<TConfig extends TIntegrationImplementation['configuration']> = {
  ctx: IntegrationContext<TConfig>
  client: Client
  logger: IntegrationLogger
}

type RegisterArgs<TConfig extends TIntegrationImplementation['configuration']> = CommonArgs<TConfig> & RegisterPayload

type UnregisterArgs<TConfig extends TIntegrationImplementation['configuration']> = CommonArgs<TConfig> &
  UnregisterPayload

type WebhookArgs<TConfig extends TIntegrationImplementation['configuration']> = CommonArgs<TConfig> & WebhookPayload

type ActionArgs<TConfig extends TIntegrationImplementation['configuration'], T, I> = CommonArgs<TConfig> &
  ActionPayload<T, I>

type CreateUserArgs<TConfig extends TIntegrationImplementation['configuration']> = CommonArgs<TConfig> &
  CreateUserPayload

type CreateConversationArgs<TConfig extends TIntegrationImplementation['configuration']> = CommonArgs<TConfig> &
  CreateConversationPayload

type MessageArgs<TConfig extends TIntegrationImplementation['configuration'], P, M, C, U> = CommonArgs<TConfig> &
  MessagePayload<P, M, C, U> & {
    ack: AckFunction
  }

type ActionFunctions<
  TConfig extends TIntegrationImplementation['configuration'],
  TActions extends TIntegrationImplementation['actions']
> = {
  [actionType in keyof TActions]: (
    props: ActionArgs<TConfig, actionType, TActions[actionType]['input']>
  ) => Promise<TActions[actionType]['output']>
}

type ChannelFunctions<
  TConfig extends TIntegrationImplementation['configuration'],
  TChannels extends TIntegrationImplementation['channels']
> = {
  [channelName in keyof TChannels]: {
    messages: {
      [messageType in keyof TChannels[channelName]]: (
        props: CommonArgs<TConfig> &
          MessageArgs<TConfig, TChannels[channelName][messageType], Message, Conversation, User>
      ) => Promise<void>
    }
  }
}

export type IntegrationImplementationProps<T extends TIntegrationImplementation = TIntegrationImplementation> = {
  register: (props: RegisterArgs<T['configuration']>) => Promise<void>
  unregister: (props: UnregisterArgs<T['configuration']>) => Promise<void>
  handler: (props: WebhookArgs<T['configuration']>) => Promise<Response | void>
  createUser?: (props: CreateUserArgs<T['configuration']>) => Promise<Response | void>
  createConversation?: (props: CreateConversationArgs<T['configuration']>) => Promise<Response | void>
  actions: ActionFunctions<T['configuration'], T['actions']>
  channels: ChannelFunctions<T['configuration'], T['channels']>
}

export class IntegrationImplementation<T extends TIntegrationImplementation = TIntegrationImplementation> {
  public props: IntegrationImplementationProps<T>
  public actions: IntegrationImplementationProps<T>['actions']
  public channels: IntegrationImplementationProps<T>['channels']
  public register: IntegrationImplementationProps<T>['register']
  public unregister: IntegrationImplementationProps<T>['unregister']
  public createUser: IntegrationImplementationProps<T>['createUser']
  public createConversation: IntegrationImplementationProps<T>['createConversation']
  public readonly handler: ReturnType<typeof integrationHandler>
  public readonly start: (port?: number) => Promise<Server>
  public constructor(props: IntegrationImplementationProps<T>) {
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
