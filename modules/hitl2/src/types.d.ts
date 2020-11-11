import * as sdk from 'botpress/sdk'
import { WorkspaceUser } from 'common/typings'

// TODO fix this and use those from common/typings
declare global {
  interface Window {
    botpressWebChat: {
      init: (config: any, containerSelector?: string) => void
    }
    BOT_ID: string
  }
}
export interface AuthRule {
  res: string
  op: string
}
export interface UserProfile {
  email: string
  isSuperAdmin: boolean
  strategyType: string
  strategy: string
  firstname?: string
  lastname?: string
  picture_url?: string
  fullName: string
  permissions: AuthRule[] | undefined
}

export type AgentType = {
  id: string
  agentId: string
  online: boolean
} & UserProfile &
  Pick<WorkspaceUser, 'role'>

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
  threadId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface SocketMessageType {
  payload: any
  resource: string
  type: string
  id: string
}
