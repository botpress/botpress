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

export interface Goal {
  id: string
  topic: string
  name: string
}

type FeedbackItemStatus = 'pending' | 'solved'
type SourceType = 'qna' | 'goal'
type CorrectedActionType = 'qna' | 'start_goal'

export interface FeedbackItem {
  sessionId: string
  eventId: number
  timestamp: Date
  source: {
    type: SourceType
    qnaItem?: QnAItem
    goal?: Goal
  }
  user: any // TODO: check if user is necessary
  status: FeedbackItemStatus
  correctedActionType: string
  correctedObjectId: string
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
