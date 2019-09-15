import Telegraf, { ContextMessageUpdate } from 'telegraf'

export type Clients = { [key: string]: Telegraf<ContextMessageUpdate> }
