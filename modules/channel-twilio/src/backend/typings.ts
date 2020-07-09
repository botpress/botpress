import { TwilioClient } from './client'

export type Clients = { [botId: string]: TwilioClient }

export type MessageOption = {
  label: string
  value: string
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
}

export type TwilioRequestBody = {
  To: string
  From: string
  Body: string
}
