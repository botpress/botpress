import type { IntegrationDefinitionProps  } from '@botpress/sdk'
import { EndConversationReasonSchema } from 'src/events/conversation-ended'
import { z } from '@botpress/sdk'

const WithSessionSchema = z.object({
  liveAgentSessionKey: z.string().describe('Key from the Chasitor conversation session'),
})

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

const StartChatInputSchema = z.object({
  userName: z.string().describe('The chat user name').default('Anonymous Visitor'),
  buttonId: z.string().describe('Button Id, use the one from config as default').optional(),
  agentId: z.string().describe('The ID of the agent of a direct-to-agent chat request. For normal chat requests, leave this field empty').optional(),
  sessionId: z.string().describe('The chat visitor’s Chat session ID').optional(),
  userAgent: z.string().describe('The chat visitor’s browser user agent.').optional().default('BotpressSFLA/1.0.0'),
  language: z.string().describe('The chat visitor’s spoken language.').default('en-US'),
  contactId: z.string().describe('Id from the contact to be associated with this chat session.').default(''),
  caseId: z.string().describe('Id from the case to be associated with this chat session.').default(''),
  prechatDetails: z.array(z.string()).describe('The pre-chat information that was provided by the chat visitor').default([]),
  prechatEntities: z.array(z.string()).describe('The records created, searched for, or both depending on what EntityFieldsMaps has enabled').default([]),
  buttonOverrides: z.array(z.string()).describe(`The button override is an ordered list of routing targets and overrides the buttonId, agentId, and doFallback modes. The possible options are:
          buttonId—Normal routing
          agentId—Direct-to-agent routing with no fallback
          agentId_buttonId—Direct-to-agent routing with fallback to the button
          You can list one or more of these options, where the order specifies the routing target order. The second or third target is attempted only if the previous one fails.`)
    .default([]),
  receiveQueueUpdates: z.boolean().describe('Indicates whether the chat visitor receives queue position updates (true) or not (false).').default(true),
})

export type StartChatInput = z.infer<typeof StartChatInputSchema>

const startChat = {
  title: 'Start Chat',
  description: 'Start Chat in the LiveAgent session',
  input: {
    schema: WithSessionSchema.merge(StartChatInputSchema),
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
      reason: z.string().min(3).default('UNKNOWN').describe('any reason for the chat to end')
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

