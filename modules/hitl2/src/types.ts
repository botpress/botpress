import { UserProfile } from 'common/typings'
import * as sdk from 'botpress/sdk'

export type AgentType = {
  id: string
  workspace: string
  role: string
  online: boolean
} & Partial<UserProfile>

export type UserType = {
  id: string
  variables?: { name: string; value: any }[]
} & Partial<UserProfile>

export interface EscalationType {
  id: string
  botId: string
  agentId?: string
  userId: string
  status: 'pending' | 'assigned' | 'resolved'
  userThreadId: string
  agentThreadId: string
  userConversation: EventType
  comments: CommentType[]
  assignedAt?: Date
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type EventType = {
  event: string | sdk.IO.Event
} & sdk.IO.StoredEvent

export interface CommentType {
  id: string
  agentId: string
  escalationId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface SocketMessageType {
  payload: {}
  resource: string
  type: string
  id: string
}
