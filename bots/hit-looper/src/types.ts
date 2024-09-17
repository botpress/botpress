import { z } from '@botpress/sdk'
import { bot } from './bot'

export type Client = MessageHandlerProps['client']

export type AsyncFunction = (...args: any[]) => Promise<any>
export type Bot = typeof bot

export type EventHandler = Parameters<Bot['event']>[0]
export type EventHandlerProps = Parameters<EventHandler>[0]
export type MessageHandler = Parameters<Bot['message']>[0]
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type ClientOperation = keyof {
  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: null
}
export type ClientInputs = {
  [K in ClientOperation]: Parameters<Client[K]>[0]
}
export type ClientOutputs = {
  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>
}
export type BotEvents = {
  [K in EventHandlerProps['event']['type']]: Extract<EventHandlerProps['event'], { type: K }>
}
type _States = NonNullable<Bot['props']['states']>
export type BotStates = {
  [K in keyof _States]: z.infer<_States[K]['schema']>
}
