import { z } from '@botpress/sdk'

const onAgentTyping = {
  title: 'Agent Typing',
  description: 'Triggered when the agent is typing',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
  }),
  ui: {},
}

const onAgentNotTyping = {
  title: 'Agent Not Typing',
  description: 'Triggered when the agent stopped typing',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
  }),
  ui: {},
}

const onAgentMessage = {
  title: 'Agent Message',
  description: 'Triggered when there is a Agent message',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    message: z.object({ text: z.string(), name: z.string() }),
  }),
  ui: {},
}

const onConversationAssigned = {
  title: 'The conversation has assigned to an Agent',
  description: 'Triggered when the agent is answering the conversation',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    agentName: z.string(),
  }),
  ui: {},
}

const onConversationTransferred = {
  title: 'The conversation has been transferred to another Agent',
  description: 'Triggered when the conversation has been transferred to another Agent',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    agentName: z.string(),
  }),
  ui: {},
}

const onConversationEnded = {
  title: 'The Conversation with the LiveAgent has ended',
  description: 'Triggered when the conversation with the LiveAgent has ended',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    reason: z.string()
  }),
  ui: {},
}

const onConversationRequestFailed = {
  title: 'On Conversation Request Failed',
  description: 'Triggered when there was an issue starting a session with LiveAgent',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    reason: z.string()
  }),
  ui: {},
}

const onConversationRequestSuccess = {
  title: 'On Conversation Request Success',
  description: 'Triggered when the session with LiveAgent starts',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
  }),
  ui: {},
}

const onQueueUpdated = {
  title: 'On Queue Updated',
  description: 'Triggered when a update about the queue is received',
  schema: z.object({
    botpressConversationId: z.string(),
    botpressUserId: z.string(),
    estimatedWaitTime: z.number(),
    position: z.number()
  }),
  ui: {},
}

export const events = {
  onAgentTyping,
  onAgentNotTyping,
  onAgentMessage,
  onConversationAssigned,
  onConversationTransferred,
  onConversationEnded,
  onConversationRequestFailed,
  onConversationRequestSuccess,
  onQueueUpdated,
}
