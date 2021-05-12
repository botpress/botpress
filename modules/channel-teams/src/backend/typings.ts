import { Activity, BotFrameworkAdapter, ConversationReference } from 'botbuilder'
import { ChannelContext } from 'common/channel'
import { TeamsClient } from './client'

export interface Clients {
  [key: string]: TeamsClient
}

export type TeamsContext = ChannelContext<BotFrameworkAdapter> & {
  messages: Partial<Activity>[]
  threadId: string
  convoRef: Partial<ConversationReference>
}
