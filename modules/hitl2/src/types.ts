interface UserProfile {
  email: string
  isSuperAdmin?: boolean
  strategyType: string
  strategy: string
  firstname?: string
  lastname?: string
  picture_url?: string
  fullName: string
  permissions?: []
}

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

export interface EventType {
  id: string
  direction: string
  botId: string
  channel: string
  success: boolean
  createdOn: Date
  threadId: string
  event: string
}

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
