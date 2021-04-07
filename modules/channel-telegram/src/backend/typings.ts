import * as sdk from 'botpress/sdk'
import Telegraf, { ContextMessageUpdate } from 'telegraf'

export interface Clients {
  [key: string]: Telegraf<ContextMessageUpdate>
}

export interface TelegramContextArgs {
  keyboardButtons<T>(arr: any[] | undefined): T[] | undefined
}

export type TelegramContext = sdk.ChannelContext<Telegraf<ContextMessageUpdate>, TelegramContextArgs>
