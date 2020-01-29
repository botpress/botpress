export type HitlSessionOverview = {
  lastMessage: Message
  user: User
} & HitlSession

export interface HitlSession {
  id: string
  botId: string
  channel: string
  userId: string
  lastEventOn: Date
  lastHeardOn: Date
  isPaused: boolean
  pausedBy: string
}

export interface User {
  id: string
  fullName: string
  avatarUrl: string
  attributes: object
}

// Hitl sessions can either be identified by sessionId, or a combination of botId, channel and target
export interface SessionIdentity {
  botId?: string
  channel?: string
  userId?: string
  sessionId?: string
}

export interface QnAItem {
  id: string
  data: {
    action: string
    answers: {
      [lang: string]: string[]
    }
    category: string
    enabled: boolean
    questions: {
      [lang: string]: string[]
    }
  }
}

type FeedbackItemState = 'pending' | 'solved'

export interface FeedbackItem {
  sessionId: string
  eventId: number
  timestamp: Date
  source: {
    type: 'qna' | 'goal'
    qnaItem?: QnAItem
  }
  user: any // TODO: check if user is necessary
  state: FeedbackItemState
  correctedActionType: string
  correctedObjectId: string
}

export interface IncomingMessage {
  id: number
  type: string
  text: string
  raw_message: any
  direction: 'in' | 'out'
  source: 'user' | 'bot'
  ts: Date
  readonly sessionId?: string
}

export interface Message {
  id: number
  type: string
  text: string
  raw_message: any
  direction: 'in' | 'out'
  source: 'user' | 'bot'
  ts: Date
  sessionId: string
}

interface MessageGroup {
  incoming: Message
  replies: Message[]
}

type FlaggedMessageGroup = MessageGroup & { flagged: boolean }
