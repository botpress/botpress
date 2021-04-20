import * as sdk from 'botpress/sdk'
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { ChatAction, ExtraEditMessage, InputFile } from 'telegraf/typings/telegram-types'

export interface Clients {
  [key: string]: Telegraf<ContextMessageUpdate>
}

export interface TelegramContextArgs {
  keyboardButtons<T>(arr: any[] | undefined): T[] | undefined
  chatId: string
}

export type TelegramContext = sdk.ChannelContext<Telegraf<ContextMessageUpdate>, TelegramContextArgs> & {
  handlers: string[]
  messages: TelegramMessage[]
}

export interface TelegramMessage {
  chatId: string
  text?: string
  animation?: string
  photo?: InputFile
  markdown?: boolean
  action?: ChatAction
  extra?: ExtraEditMessage
}
