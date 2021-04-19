import * as sdk from 'botpress/sdk'
import Telegraf, { ContextMessageUpdate } from 'telegraf'

export interface Clients {
  [key: string]: Telegraf<ContextMessageUpdate>
}

export interface TelegramContextArgs {
  keyboardButtons<T>(arr: any[] | undefined): T[] | undefined
  chatId: string
}

export type TelegramContext = sdk.ChannelContext<Telegraf<ContextMessageUpdate>, TelegramContextArgs>
