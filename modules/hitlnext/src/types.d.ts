import * as sdk from 'botpress/sdk'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'

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
export interface IUserProfile {
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

export type IAgent = {
  agentId: string
  online: boolean
  role?: Pick<WorkspaceUserWithAttributes, 'role'>
  workspace?: Pick<WorkspaceUserWithAttributes, 'workspace'>
  attributes: Pick<IUserProfile, 'firstname' | 'lastname'>
} & Pick<IUserProfile, 'email' | 'strategy' | 'isSuperAdmin' | 'permissions'>

export type IUser = {
  id: string
  variables?: { name: string; value: any }[]
} & Partial<IUserProfile>

export type EscalationType = 'pending' | 'assigned' | 'resolved'
export interface IEscalation {
  id: string
  botId: string
  agentId?: string
  userId: string
  status: EscalationType
  userChannel: string
  userThreadId: string
  agentThreadId: string
  userConversation: IEvent
  comments: IComment[]
  assignedAt?: Date
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type IEvent = {
  event: string | sdk.IO.Event
} & sdk.IO.StoredEvent

export interface IComment {
  id: string
  agentId: string
  escalationId: string
  threadId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface ISocketMessage {
  payload: any
  resource: string
  type: string
  id: string
}
