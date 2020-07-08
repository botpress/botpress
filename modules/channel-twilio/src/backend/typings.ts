import { TwilioClient } from './client'

export type Clients = { [botId: string]: TwilioClient }

export type MessageOption = {
  label: string
  value: string
}
