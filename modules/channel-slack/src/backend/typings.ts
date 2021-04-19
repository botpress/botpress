import SlackEventAdapter from '@slack/events-api/dist/adapter'
import SlackMessageAdapter from '@slack/interactive-messages/dist/adapter'
import { RTMClient } from '@slack/rtm-api'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import * as sdk from 'botpress/sdk'
import { SlackClient } from './client'

export interface Clients {
  [key: string]: SlackClient
}

export interface SlackEndpoints {
  web: WebClient
  rtm: RTMClient
  events: SlackEventAdapter
  interactive: SlackMessageAdapter
}

export interface SlackContextArgs {
  channelId: string
}

export type SlackContext = sdk.ChannelContext<SlackEndpoints, SlackContextArgs> & {
  message: ChatPostMessageArguments
  handlers: string[]
}
