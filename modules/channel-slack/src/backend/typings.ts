import SlackEventAdapter from '@slack/events-api/dist/adapter'
import SlackMessageAdapter from '@slack/interactive-messages/dist/adapter'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import { ChannelContext } from 'common/channel'
import { SlackClient } from './client'

export interface Clients {
  [key: string]: SlackClient
}

export interface SlackEndpoints {
  web: WebClient
  events: SlackEventAdapter
  interactive: SlackMessageAdapter
}

export type SlackContext = ChannelContext<SlackEndpoints> & {
  message: Partial<ChatPostMessageArguments>
  channelId: string
}
