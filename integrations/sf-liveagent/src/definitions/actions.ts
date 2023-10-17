import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { EndConversationReasonSchema } from 'src/events/conversation-ended'
import z from 'zod'
import { LiveAgentSessionSchema } from './schemas'

const createConversationSession = {
  title: 'Create Conversation Session',
  description: 'Creates a new Conversation Session',
  input: {
    schema: z.object({}),
    ui: {},
  },
  output: {
    schema: LiveAgentSessionSchema,
  },
}

const startChat = {
  title: 'Start Chat',
  description: 'Start Chat in the LiveAgent session',
  input: {
    schema: z.object({
      userName: z.string().describe('Requester User Name'),
      session: LiveAgentSessionSchema,
    }),
    ui: {
      userName: {
        title: 'Requester User Name',
      }
    },
  },
  output: {
    schema: z.object({})
  },
}

const getConversationFromSession = {
  title: 'Get Conversation Id from Session',
  description: 'Gets the conversation id from the LiveAgent Session',
  input: {
    schema: z.object({
      session: LiveAgentSessionSchema,
    }),
    ui: {
      session: {
        title: 'Live Agent Session Object',
      }
    },
  },
  output: {
    schema: z.object({
      conversationId: z.string()
    }),
  },
}

const endConversationSession = {
  title: 'End Conversation Session',
  description: 'Ends the current Conversation Session',
  input: {
    schema: z.object({
      conversationId: z.string().describe('Id from the Botpress conversation'),
      reason: EndConversationReasonSchema
    }),
    ui: {},
  },
  output: {
    schema: z.object({}),
  },
}

export const actions = {
  createConversationSession,
  startChat,
  getConversationFromSession,
  endConversationSession
} satisfies IntegrationDefinitionProps['actions']

