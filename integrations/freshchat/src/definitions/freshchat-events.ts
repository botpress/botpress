// Enum for actor types
type ActorType = 'user' | 'agent' | 'system'

// Enum for message types
type MessageType = 'normal' | 'private'

// Actor definition
type Actor = {
  actor_type: ActorType
  actor_id: string
}

// Generic Event type that all specific event types will extend
export type FreshchatEvent<T> = {
  actor: Actor
  action: 'message_create' | 'conversation_assignment' | 'conversation_resolution' | 'conversation_reopen'
  action_time: string
  data: T
}

// Message part and message for the message_create event
type FreshChatText = {
  content: string
}

type MessagePart = {
  text: FreshChatText
}

type Message = {
  message_parts: MessagePart[]
  app_id: string
  actor_id: string
  id: string
  channel_id: string
  conversation_id: string
  interaction_id: string
  actor_type: ActorType
  created_time: string
  user_id: string
  restrictResponse?: boolean
  botsPrivateNote?: boolean
  message_type?: MessageType
  message_source?: string
}

type MessageCreateData = {
  message: Message
}

// Types for conversation events
type Conversation = {
  conversation_id: string
  app_id: string
  status: string
  channel_id: string
  skill_id: number
  sla_policy_id: number
  sla_breached: boolean
  assigned_agent_id?: string
  assigned_org_agent_id?: string
  assigned_group_id?: string
}

type ReopenData = {
  reopener: string
  reopener_id: string
  conversation: Conversation
  interaction_id: string
}

type ResolveData = {
  resolve: Resolve
}

type Resolve = {
  resolver: string
  resolver_id: string
  conversation: Conversation
  interaction_id: string
  user?: User
}

type AssignmentData = {
  assignment: Assignment
}

type Assignment = {
  assignor: string
  assignor_id: string
  to_agent_id: string
  to_group_id: string
  from_agent_id: string
  from_group_id: string
  conversation: Conversation
  interaction_id: string
}

type User = {
  properties: Property[]
  created_time: string
  updated_time: string
  id: string
  first_name: string
  avatar: Avatar
  login_status: boolean
}

type Property = {
  name: string
  value: string
}

type Avatar = {
  url: string
}

// Event type instances
export type MessageCreateFreshchatEvent = FreshchatEvent<MessageCreateData>
export type ConversationReopenFreshchatEvent = FreshchatEvent<ReopenData>
export type ConversationResolutionFreshchatEvent = FreshchatEvent<ResolveData>
export type ConversationAssignmentFreshchatEvent = FreshchatEvent<AssignmentData>
