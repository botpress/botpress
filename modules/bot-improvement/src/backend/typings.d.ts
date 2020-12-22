import { Flow, FlowNode, IO } from 'botpress/sdk'

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
  eventId: string
  timestamp: Date
  source: {
    type: SourceType
    qnaItem?: QnAItem
    goal?: Goal
  }
  user: any // TODO: check if user is necessary
  status: FeedbackItemStatus
  correctedActionType: CorrectedActionType
  correctedObjectId: string
}

export interface Message {
  id: string
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

interface FlowMutex {
  lastModifiedBy: string
  lastModifiedAt: Date
  remainingSeconds?: number
}

interface NodeLinkView {
  source: string
  target: string
  points: FlowPoint[]
}

interface FlowPoint {
  x: number
  y: number
}
declare type NodeView = FlowNode & FlowPoint

export declare type FlowView = Flow & {
  nodes: NodeView[]
  links: NodeLinkView[]
  currentMutex?: FlowMutex
}
