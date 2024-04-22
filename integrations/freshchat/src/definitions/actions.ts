import { ActionDefinition } from 'src/schemas'
import z from 'zod'
import { UserWithFreshchatInfoSchema, ConversationWithFreshchatInfoSchema } from './schemas'

const createConversation: ActionDefinition = {
  title: 'Create Proxy Conversation',
  description: 'Creates a new Botpress Proxy Conversation and Map to a new Freshchat Conversation',
  input: {
    schema: z.object({ userId: z.string(), transcript: z.string(), originConversationId: z.string(), originUserId: z.string() }),
    ui: {},
  },
  output: {
    schema: ConversationWithFreshchatInfoSchema
  },
}

const sendMessage: ActionDefinition = {
  title: 'Send Message to Proxy',
  description: 'Sends a message to the proxy Freshdesk/Botpress conversation',
  input: {
    schema: z.object({ payload: z.string(), proxyConversationId: z.string(), proxyUserId: z.string() }),
    ui: {},
  },
  output: {
    schema: z.object({})
  },
}

const getCreateUser: ActionDefinition = {
  title: 'Get or Create Proxy User',
  description: 'Finds a Freshchat/Botpress proxy user with the specified email or creates a new Freshchat/Botpress proxy user',
  input: {
    schema: z.object({ email: z.string() }),
    ui: {},
  },
  output: {
    schema: UserWithFreshchatInfoSchema
  },
}

export const actions = {
  createConversation,
  getCreateUser,
  sendMessage
}

