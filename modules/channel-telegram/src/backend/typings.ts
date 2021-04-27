import * as sdk from 'botpress/sdk'
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import { ChatAction, ExtraEditMessage, InputFile } from 'telegraf/typings/telegram-types'

export interface Clients {
  [key: string]: Telegraf<ContextMessageUpdate>
}

export type TelegramContext = sdk.ChannelContext<Telegraf<ContextMessageUpdate>> & {
  chatId: string
  messages: TelegramMessage[]
}

export interface TelegramMessage {
  text?: string
  animation?: string
  photo?: InputFile
  markdown?: boolean
  action?: ChatAction
  extra?: ExtraEditMessage
}
