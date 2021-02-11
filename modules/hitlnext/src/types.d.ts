import * as sdk from 'botpress/sdk'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'

// TODO fix this and use those from common/typings
declare global {
  interface Window {
    botpressWebChat: {
      init: (config: any, containerSelector?: string) => void
    }
    BOT_ID: string
    BP_STORAGE: any
    ROOT_PATH: string
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
  attributes?: Pick<IUserProfile, 'firstname' | 'lastname' | 'picture_url'>
} & Pick<IUserProfile, 'email' | 'strategy' | 'isSuperAdmin' | 'permissions'>

export type HandoffType = 'pending' | 'assigned' | 'resolved'
export interface IHandoff {
  id: string
  botId: string
  agentId?: string
  userId: string
  status: HandoffType
  userChannel: string
  userThreadId: string
  agentThreadId: string
  userConversation: IEvent
  comments: IComment[]
  tags: string[]
  user: IUser
  assignedAt?: Date
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface IUserAttributes extends Object {
  timezone: string
  language: string
  email: string
  [key: string]: any
}

export interface IUser {
  id: string
  attributes: IUserAttributes
}

export type IEvent = {
  event: string | sdk.IO.Event
} & sdk.IO.StoredEvent

export interface IComment {
  id: string
  agentId: string
  handoffId: string
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
