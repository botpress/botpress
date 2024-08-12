import { ActionDefinition } from 'src/schemas'
import { z } from '@botpress/sdk'
import {
  FreshchatUserSchema,
  FreshchatConversationSchema
} from './schemas'

const createConversation: ActionDefinition = {
  title: 'Create Freshchat Conversation',
  description: 'Creates a Freshchat Conversation',
  input: {
    schema: z.object({ freshchatUserId: z.string(), transcript: z.string() }),
    ui: {},
  },
  output: {
    schema: FreshchatConversationSchema
  },
}

const updateConversation: ActionDefinition = {
  title: 'Update Freshchat Conversation',
  description: 'Updates Freshchat Conversation',
  input: {
    schema: z.object({
      freshchatConversationId: z.string(),
      status: z.string().default('new').placeholder('status ex: new').title('Conversation Status (new,assigned,resolved,reopened)').describe('New Conversation Status'),
      assignedGroupId: z.string().optional(),
      assignedAgentId: z.string().optional(),
      channelId: z.string().optional(),
      properties: z.string().default('{}').optional()
    }),
  },
  output: {
    schema: z.object({ success: z.boolean(), message: z.string().optional(), data: FreshchatConversationSchema.optional() })
  },
}

const listenConversation: ActionDefinition = {
  title: 'Listen Freshchat Conversation',
  description: 'The supplied Botpress conversation will listen events from the supplied Freshchat Conversation',
  input: {
    schema: z.object({ botpressConversationId: z.string(), freshchatConversationId: z.string() }),
    ui: {},
  },
  output: {
    schema: z.object({ success: z.boolean() })
  },
}

const sendMessage: ActionDefinition = {
  title: 'Send Message to Freshchat',
  description: 'Sends a message to the Freshchat conversation',
  input: {
    schema: z.object({ payload: z.string(), freshchatConversationId: z.string(), freshchatUserId: z.string() }),
    ui: {},
  },
  output: {
    schema: z.object({})
  },
}

const getCreateUser: ActionDefinition = {
  title: 'Get or Create Freshchat User',
  description: 'Finds a Freshchat user with the specified email or creates a new Freshchat user',
  input: {
    schema: z.object({ email: z.string() }),
    ui: {},
  },
  output: {
    schema: FreshchatUserSchema
  },
}


export const actions = {
  createConversation,
  updateConversation,
  listenConversation,
  getCreateUser,
  sendMessage
}

