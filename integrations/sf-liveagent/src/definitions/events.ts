import { EndConversationReasonSchema } from 'src/events/conversation-ended'
import z from 'zod'
import { ConversationSchema } from './schemas'

const onAgentTyping = {
  title: 'Agent Typing',
  description: 'Triggered when the agent is typing',
  schema: z.object({
    conversation: ConversationSchema,
  }),
  ui: {},
}

const onAgentNotTyping = {
  title: 'Agent Not Typing',
  description: 'Triggered when the agent stopped typing',
  schema: z.object({
    conversation: ConversationSchema,
  }),
  ui: {},
}

const onConversationAssigned = {
  title: 'The conversation has assigned to an Agent',
  description: 'Triggered when the agent is answering the conversation',
  schema: z.object({
    conversation: ConversationSchema,
    agentName: z.string(),
  }),
  ui: {},
}

const onConversationEnded = {
  title: 'The Conversation with the LiveAgent has ended',
  description: 'Triggered when the conversation with the LiveAgent has ended',
  schema: z.object({
    conversation: ConversationSchema,
    reason: EndConversationReasonSchema
  }),
  ui: {},
}

const onConversationRequestFailed = {
  title: 'On Conversation Request Failed',
  description: 'Triggered when there was an issue starting a session with LiveAgent',
  schema: z.object({
    conversation: ConversationSchema,
    reason: z.string()
  }),
  ui: {},
}

const onConversationRequestSuccess = {
  title: 'On Conversation Request Success',
  description: 'Triggered when the session with LiveAgent starts',
  schema: z.object({
    conversation: ConversationSchema,
  }),
  ui: {},
}

const onQueueUpdated = {
  title: 'On Queue Updated',
  description: 'Triggered when a update about the queue is received',
  schema: z.object({
    conversation: ConversationSchema,
    estimatedWaitTime: z.number(),
    position: z.number()
  }),
  ui: {},
}

export const events = {
  onAgentTyping,
  onAgentNotTyping,
  onConversationAssigned,
  onConversationEnded,
  onConversationRequestFailed,
  onConversationRequestSuccess,
  onQueueUpdated,
}
