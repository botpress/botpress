import * as sdk from 'botpress/sdk'
import { ChannelContext } from 'common/channel'
import { Twilio } from 'twilio'
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'
import { TwilioClient } from './client'

export interface Clients {
  [botId: string]: TwilioClient
}

export interface MessageOption {
  label: string
  value: string
}

export interface TwilioRequestBody {
  To: string
  From: string
  Body: string
  MediaUrl0: string
}
export interface ChoiceOption {
  title: string
  payload: string
}

export type TwilioContext = ChannelContext<Twilio> & {
  messages: Partial<MessageInstance>[]
  botPhoneNumber: string
  prepareIndexResponse(event: sdk.IO.OutgoingEvent, options: MessageOption[]): Promise<void>
}
