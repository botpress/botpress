import type * as bp from '.botpress'

type ValueOf<T> = T[keyof T]
type AsyncFunction = (...args: any[]) => Promise<any>

export type RegisterFunction = bp.IntegrationProps['register']
export type UnregisterFunction = bp.IntegrationProps['unregister']

export type Handler = bp.IntegrationProps['handler']
export type HandlerProps = Parameters<Handler>[0]

export type Action = ValueOf<bp.IntegrationProps['actions']>
export type ActionProps = Parameters<Action>[0]

export type Channel = ValueOf<bp.IntegrationProps['channels']>
export type MessageHandler = ValueOf<Channel['messages']>
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type Context = HandlerProps['ctx']
export type Logger = HandlerProps['logger']
export type AckFunction = MessageHandlerProps['ack']

export type ClientOperation = ValueOf<{
  [K in keyof bp.Client as bp.Client[K] extends AsyncFunction ? K : never]: K
}>
export type ClientRequests = {
  [K in ClientOperation]: Parameters<bp.Client[K]>[0]
}
export type ClientResponses = {
  [K in ClientOperation]: ReturnType<bp.Client[K]>
}
