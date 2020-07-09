import { TwilioClient } from './client'

export type Clients = { [botId: string]: TwilioClient }

export type MessageOption = {
  label: string
  value: string
  type: 'text' | 'postback' | 'quick_reply'
}

export type TwilioRequestBody = {
  To: string
  From: string
  Body: string
}
