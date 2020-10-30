import Telegraf, { ContextMessageUpdate } from 'telegraf'

export interface Clients {
  [key: string]: Telegraf<ContextMessageUpdate>
}
