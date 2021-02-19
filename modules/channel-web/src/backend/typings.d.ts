import { Raw } from 'knex'

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
