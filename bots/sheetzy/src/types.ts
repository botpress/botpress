import * as sdk from '@botpress/sdk'
import { bot } from './bot'

export type Bot = typeof bot

export type MessageHandler = Parameters<Bot['message']>[0]
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type EventHandler = Parameters<Bot['event']>[0]
export type EventHandlerProps = Parameters<EventHandler>[0]

export type Client = EventHandlerProps['client']

type TBot = Client extends sdk.BotSpecificClient<infer T> ? T : never
export type BotStates = TBot['states']
export type BotEvents = TBot['events']
