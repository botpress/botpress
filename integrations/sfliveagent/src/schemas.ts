import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

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

export type ActionCreateConversationSession = bp.IntegrationProps['actions']['createConversationSession']
export type ActionPropsCreateConversationSession = Parameters<ActionCreateConversation>[0]

export type ActionListenConversation = bp.IntegrationProps['actions']['listenConversation']
export type ActionPropsListenConversation = Parameters<ActionCreateConversation>[0]

export type ActionListenConversation = bp.IntegrationProps['actions']['listenConversation']
export type ActionPropsListenConversation = Parameters<ActionCreateConversation>[0]

export type ActionListenConversation = bp.IntegrationProps['actions']['listenConversation']
export type ActionPropsListenConversation = Parameters<ActionCreateConversation>[0]


export type ActionSendMessage = bp.IntegrationProps['actions']['sendMessage']

export type Channel = ValueOf<bp.IntegrationProps['channels']>
export type MessageHandler = ValueOf<Channel['messages']>
export type MessageHandlerProps = Parameters<MessageHandler>[0]
