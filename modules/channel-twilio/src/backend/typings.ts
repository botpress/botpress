import * as sdk from 'botpress/sdk'
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
}
export interface ChoiceOption {
  title: string
  payload: string
}

export interface TwilioContextArgs {
  prepareIndexResponse(event: sdk.IO.OutgoingEvent, options: MessageOption[]): Promise<void>
}

export type TwilioContext = sdk.ChannelContext<Twilio, TwilioContextArgs> & {
  handlers: string[]
  message: MessageInstance
}
