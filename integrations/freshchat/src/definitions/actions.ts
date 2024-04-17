import { ActionDefinition } from 'src/schemas'
import z from 'zod'
import { UserWithFreshchatInfoSchema, ConversationWithFreshchatInfoSchema } from './schemas'

const createConversation: ActionDefinition = {
  title: 'Create Conversation',
  description: 'Creates a new Botpress Conversation and Map to a new Freshchat Conversation',
  input: {
    schema: z.object({ userId: z.string(), transcript: z.string(), originConversationId: z.string(), originUserId: z.string() }),
    ui: {},
  },
  output: {
    schema: ConversationWithFreshchatInfoSchema
  },
}

const getCreateUser: ActionDefinition = {
  title: 'Get or Create User',
  description: 'Finds a Freshchat/Botpress user with the specified email or creates a new Freshchat/Botpress user',
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
  getCreateUser
}

