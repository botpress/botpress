import type { IntegrationDefinitionProps  } from '@botpress/sdk'
import { EndConversationReasonSchema } from 'src/events/conversation-ended'
import { z } from '@botpress/sdk'

const createConversationSession = {
  title: 'Create Conversation Session',
  description: 'Creates a new Conversation Session',
  input: {
    schema: z.object({ ignore: z.string().optional() }),
    ui: {},
  },
  output: {
    schema: z.object({ success: z.boolean(), liveAgentSessionKey: z.string().optional(), message: z.string().optional() }),
  },
}

const startChat = {
  title: 'Start Chat',
  description: 'Start Chat in the LiveAgent session',
  input: {
    schema: z.object({
      userName: z.string().describe('Requester User Name'),
      liveAgentSessionKey: z.string().describe('Key from the Chasitor conversation session'),
    }),
    ui: {
      userName: {
        title: 'Requester User Name',
      }
    },
  },
  output: {
    schema: z.object({ success: z.boolean() })
  },
}

const listenConversation = {
  title: 'Listen Chasitor Conversation Session',
  description: 'The supplied Botpress conversation will listen events from the supplied Chasitor Session',
  input: {
    schema: z.object({ botpressConversationId: z.string(), liveAgentSessionKey: z.string() }),
    ui: {},
  },
  output: {
    schema: z.object({ success: z.boolean() })
  },
}

const endConversationSession = {
  title: 'End Conversation Session',
  description: 'Ends the current Conversation Session',
  input: {
    schema: z.object({
      liveAgentSessionKey: z.string().describe('Key from the Chasitor conversation session'),
      reason: z.string().default('UNKNOWN').describe('any reason for the chat to end')
    }),
    ui: {},
  },
  output: {
    schema: z.object({ success: z.boolean() }),
  },
}

const sendMessage = {
  title: 'Send Message to the LiveAgent Session',
  description: 'Sends a message to the LiveAgent Session',
  input: {
    schema: z.object({ payload: z.string(), liveAgentSessionKey: z.string() }),
    ui: {},
  },
  output: {
    schema: z.object({ success: z.boolean() }),
  },
}

export const actions = {
  createConversationSession,
  startChat,
  listenConversation,
  endConversationSession,
  sendMessage
} satisfies IntegrationDefinitionProps['actions']

