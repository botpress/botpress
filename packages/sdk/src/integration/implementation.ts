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

type TIntegration = {
  configuration: Record<string, any>
  actions: Record<string, Record<'input' | 'output', any>>
  channels: Record<
    string,
    {
      messages: Record<string, any>
      message: {
        tags: Record<string, any>
      }
      conversation: {
        tags: Record<string, any>
        creation: {
          enabled: boolean
          requiredTags: string[]
        }
      }
    }
  >
  events: Record<string, any>
  states: Record<string, any>
  user: {
    tags: Record<string, any>
    creation: {
      enabled: boolean
      requiredTags: string[]
    }
  }
}

type CommonArgs<TConfig extends TIntegration['configuration']> = {
  ctx: IntegrationContext<TConfig>
  client: Client
  logger: IntegrationLogger
}

type RegisterArgs<TConfig extends TIntegration['configuration']> = CommonArgs<TConfig> & RegisterPayload

type UnregisterArgs<TConfig extends TIntegration['configuration']> = CommonArgs<TConfig> & UnregisterPayload

type WebhookArgs<TConfig extends TIntegration['configuration']> = CommonArgs<TConfig> & WebhookPayload

type ActionArgs<TConfig extends TIntegration['configuration'], T, I> = CommonArgs<TConfig> & ActionPayload<T, I>

type CreateUserArgs<TConfig extends TIntegration['configuration']> = CommonArgs<TConfig> & CreateUserPayload

type CreateConversationArgs<TConfig extends TIntegration['configuration']> = CommonArgs<TConfig> &
  CreateConversationPayload

type MessageArgs<TConfig extends TIntegration['configuration'], P, M, C, U> = CommonArgs<TConfig> &
  MessagePayload<P, M, C, U> & {
    ack: AckFunction
  }

type ActionFunctions<TConfig extends TIntegration['configuration'], TActions extends TIntegration['actions']> = {
  [ActionType in keyof TActions]: (
    props: ActionArgs<TConfig, ActionType, TActions[ActionType]['input']>
  ) => Promise<TActions[ActionType]['output']>
}

type ChannelFunctions<TConfig extends TIntegration['configuration'], TChannels extends TIntegration['channels']> = {
  [ChannelName in keyof TChannels]: {
    messages: {
      [MessageType in keyof TChannels[ChannelName]['messages']]: (
        props: CommonArgs<TConfig> &
          MessageArgs<TConfig, TChannels[ChannelName]['messages'][MessageType], Message, Conversation, User>
      ) => Promise<void>
    }
  }
}

export type IntegrationImplementationProps<T extends TIntegration = TIntegration> = {
  register: (props: RegisterArgs<T['configuration']>) => Promise<void>
  unregister: (props: UnregisterArgs<T['configuration']>) => Promise<void>
  handler: (props: WebhookArgs<T['configuration']>) => Promise<Response | void>
  createUser?: (props: CreateUserArgs<T['configuration']>) => Promise<Response | void>
  createConversation?: (props: CreateConversationArgs<T['configuration']>) => Promise<Response | void>
  actions: ActionFunctions<T['configuration'], T['actions']>
  channels: ChannelFunctions<T['configuration'], T['channels']>
}

export class IntegrationImplementation<T extends TIntegration = TIntegration> {
  public readonly props: IntegrationImplementationProps<T>
  public readonly actions: IntegrationImplementationProps<T>['actions']
  public readonly channels: IntegrationImplementationProps<T>['channels']
  public readonly register: IntegrationImplementationProps<T>['register']
  public readonly unregister: IntegrationImplementationProps<T>['unregister']
  public readonly createUser: IntegrationImplementationProps<T>['createUser']
  public readonly createConversation: IntegrationImplementationProps<T>['createConversation']
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
