import type { Client, Conversation, Message, User } from '@botpress/client'
import type { Server } from 'node:http'
import { Request, Response, serve } from '../serve'
import type { IntegrationContext } from './context'
import { integrationHandler } from './server'

type IntegrationProps<Configuration> = {
  ctx: IntegrationContext<Configuration>
  client: Client
}

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

export type EventPayload<E> = {
  event: E
}

export type CreateUserPayload = {
  tags: Tags
}

export type CreateConversationPayload = {
  channel: string
  tags: Tags
}

type Tags = { [key: string]: string }

export type AckFunction = (props: { tags: Tags }) => Promise<void>

export type MessagePayload<P, M, C, U> = {
  payload: P
  conversation: C
  message: M
  user: U
  type: string
}

type ActionDefinitions = {
  [actionType: string]: {
    input: any
    output: any
  }
}

type ChannelDefinitions = {
  [channelName: string]: MessageDefinitions
}

type EventDefinitions = {
  [eventName: string]: any
}

type MessageDefinitions = {
  [messageType: string]: any
}

type ActionFunctions<Configuration, A extends ActionDefinitions> = {
  [actionType in keyof A]: (
    props: IntegrationProps<Configuration> & ActionPayload<actionType, A[actionType]['input']>
  ) => Promise<A[actionType]['output']>
}

type MessageHandlerProps = {
  ack: AckFunction
}

export type ChannelFunctions<Configuration, C extends ChannelDefinitions> = {
  [channelName in keyof C]: {
    messages: {
      [messageType in keyof C[channelName]]: (
        props: IntegrationProps<Configuration> &
          MessagePayload<C[channelName][messageType], Message, Conversation, User> &
          MessageHandlerProps
      ) => Promise<void>
    }
  }
}

export type IntegrationImplementationProps<
  Configuration = any,
  Actions extends ActionDefinitions = any,
  Channels extends ChannelDefinitions = any,
  _Events extends EventDefinitions = any
> = {
  register: (props: IntegrationProps<Configuration> & RegisterPayload) => Promise<void>
  unregister: (props: IntegrationProps<Configuration> & UnregisterPayload) => Promise<void>
  handler: (props: IntegrationProps<Configuration> & WebhookPayload) => Promise<Response | void>
  createUser?: (props: IntegrationProps<Configuration> & CreateUserPayload) => Promise<Response | void>
  createConversation?: (props: IntegrationProps<Configuration> & CreateConversationPayload) => Promise<Response | void>
  actions: ActionFunctions<Configuration, Actions>
  channels: ChannelFunctions<Configuration, Channels>
}

export class IntegrationImplementation<
  Configuration = any,
  Actions extends ActionDefinitions = any,
  Channels extends ChannelDefinitions = any,
  Events extends EventDefinitions = any
> {
  public readonly actions: IntegrationImplementationProps<Configuration, Actions, Channels, Events>['actions']
  public readonly channels: IntegrationImplementationProps<Configuration, Actions, Channels, Events>['channels']
  public readonly register: IntegrationImplementationProps<Configuration, Actions, Channels, Events>['register']
  public readonly unregister: IntegrationImplementationProps<Configuration, Actions, Channels, Events>['unregister']
  public readonly handler: ReturnType<typeof integrationHandler>
  public readonly start: (port?: number) => Promise<Server>

  public constructor(props: IntegrationImplementationProps<Configuration, Actions, Channels, Events>) {
    this.actions = props.actions
    this.channels = props.channels
    this.register = props.register
    this.unregister = props.unregister
    this.handler = integrationHandler(props)
    this.start = (port?: number) => serve(this.handler, port)
  }
}
