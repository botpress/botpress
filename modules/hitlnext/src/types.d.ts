import * as sdk from 'botpress/sdk'
import { UserProfile } from 'common/typings'

// TODO fix this and use those from common/typings
export interface AuthRule {
  res: string
  op: string
}

export type IAgent = sdk.WorkspaceUserWithAttributes & {
  agentId: string
  online: boolean
  attributes: Partial<{ firstname: string; lastname: string; picture_url: string }>
}

export type AgentWithPermissions = IAgent & UserProfile

export type HandoffStatus = 'pending' | 'assigned' | 'resolved' | 'expired' | 'rejected'
export interface IHandoff {
  id: string
  botId: string
  agentId?: string
  userId: string
  status: HandoffStatus
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

export type ExitTypes = 'timedOutWaitingAgent' | 'handoffResolved' | 'noAgent'

export interface SkillData {
  redirectNoAgent: boolean
  timeoutDelay: number
}

// These are properties provided by the studio
export interface SkillProps<T> {
  initialData: T
  onDataChanged: (data: T) => void
  onValidChanged: (canSubmit: boolean) => void
  resizeBuilderWindow: (newSize: 'normal' | 'large' | 'small') => void
  contentLang: string
  defaultLanguage: string
  languages: string[]
}
