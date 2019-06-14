import * as sdk from 'botpress/sdk'

export interface ConversationInfo {
  id: string
  count: number
}

export interface MessageGroup {
  isFlagged: boolean
  userMessage: sdk.IO.IncomingEvent
  botMessages: sdk.IO.OutgoingEvent[]
}

export interface QueryFilters {
  flag: boolean
}
