import * as sdk from 'botpress/sdk'
import { Twilio } from 'twilio'
import { TwilioClient } from './client'

export interface Clients {
  [botId: string]: TwilioClient
}

export interface MessageOption {
  label: string
  value: string
  type: 'say_something' | 'postback' | 'quick_reply' | 'url'
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
  sendMessage(event: sdk.IO.Event, args: any): Promise<void>
  sendOptions(event: sdk.IO.Event, text: string, args: any, options: MessageOption[]): Promise<void>
}

export type TwilioContext = sdk.ChannelContext<Twilio, TwilioContextArgs>
