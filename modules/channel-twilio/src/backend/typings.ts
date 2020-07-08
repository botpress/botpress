import { TwilioClient } from './client'

export type Clients = { [botId: string]: TwilioClient }

export type MessageOption = {
  label: string
  value: string
}

export type TwilioRequestBody = {
  To: string
  From: string
  Body: string
}
