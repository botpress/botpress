import { Raw } from 'knex'

export interface DBMessage {
  id: string
  userId: string
  incomingEventId: string
  conversationId: number
  avatar_url: string | undefined
  full_name: string
  message_data: any | undefined
  message_raw: any | undefined
  message_text: string | undefined
  message_type: string | undefined
  payload: any
  sent_on: Raw<any>
}
