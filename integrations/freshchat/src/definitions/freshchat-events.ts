// Enum for actor types
enum ActorType {
  User = "user",
  Agent = "agent",
  System = "system"
}

// Enum for message types
enum MessageType {
  Normal = "normal",
  Private = "private"
}

// Actor definition
interface Actor {
  actor_type: ActorType;
  actor_id: string;
}

// Generic Event type that all specific event types will extend
interface FreshchatEvent<T> {
  actor: Actor;
  action: 'message_create' | 'conversation_assignment' | 'conversation_resolution' | 'conversation_reopen';
  action_time: string;
  data: T;
}

// Message part and message for the message_create event
interface Text {
  content: string;
}

interface MessagePart {
  text: Text;
}

interface Message {
  message_parts: MessagePart[];
  app_id: string;
  actor_id: string;
  id: string;
  channel_id: string;
  conversation_id: string;
  interaction_id: string;
  actor_type: ActorType;
  created_time: string;
  user_id: string;
  restrictResponse?: boolean;
  botsPrivateNote?: boolean;
  message_type?: MessageType;
  message_source?: string;
}

interface MessageCreateData {
  message: Message;
}

// Types for conversation events
interface Conversation {
  conversation_id: string;
  app_id: string;
  status: string;
  channel_id: string;
  skill_id: number;
  sla_policy_id: number;
  sla_breached: boolean;
  assigned_agent_id?: string;
  assigned_org_agent_id?: string;
  assigned_group_id?: string;
}

interface ReopenData {
  reopener: string;
  reopener_id: string;
  conversation: Conversation;
  interaction_id: string;
}

interface ResolveData {
  resolve: Resolve
}

interface Resolve {
  resolver: string;
  resolver_id: string;
  conversation: Conversation;
  interaction_id: string;
  user?: User;
}

interface AssignmentData {
  assignment: Assignment
}

interface Assignment {
  assignor: string;
  assignor_id: string;
  to_agent_id: string;
  to_group_id: string;
  from_agent_id: string;
  from_group_id: string;
  conversation: Conversation;
  interaction_id: string;
}

interface User {
  properties: Property[];
  created_time: string;
  updated_time: string;
  id: string;
  first_name: string;
  avatar: Avatar;
  login_status: boolean;
}

interface Property {
  name: string;
  value: string;
}

interface Avatar {
  url: string;
}

// Event type instances
type MessageCreateFreshchatEvent = FreshchatEvent<MessageCreateData>;
type ConversationReopenFreshchatEvent = FreshchatEvent<ReopenData>;
type ConversationResolutionFreshchatEvent = FreshchatEvent<ResolveData>;
type ConversationAssignmentFreshchatEvent = FreshchatEvent<AssignmentData>;
