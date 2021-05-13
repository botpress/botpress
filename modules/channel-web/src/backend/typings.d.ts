import * as sdk from 'botpress/sdk'
import { ChannelContext } from 'common/channel'
import { Raw } from 'knex'
import Database from './db'

export interface DBMessage {
  id: string
  userId: string
  eventId: string
  incomingEventId: string
  conversationId: number
  avatar_url?: string
  full_name: string
  message_data?: any
  message_raw?: any
  message_text?: string
  message_type?: string
  payload: any
  sent_on: Raw<any>
  retry?: number
}

export type WebContext = ChannelContext<typeof sdk> & {
  messages: Partial<sdk.Content>[]
  conversationId: number
  db: Database
  botName: string
  botAvatarUrl
}
