import { z, IntegrationDefinition } from '@botpress/sdk'
import hitl from './bp_modules/hitl'

export default new IntegrationDefinition({
  name: 'plus/chatwoot',
  title: 'Chatwoot',
  description: 'Connect your Botpress bot to Chatwoot with HITL support',
  version: '1.0.4',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z.object({
      apiAccessToken: z.string().min(1).describe('Your Chatwoot API access token'),
      inboxId: z.string().min(1).describe('Chatwoot Inbox ID for HITL and messaging channel conversations'),
      accountId: z.string().min(1).describe('Chatwoot Account ID'),
    }),
  },

  events: {
    hitlStarted: {
      title: 'HITL Started',
      description: 'Triggered when a HITL session started',
      schema: z.object({
        userId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        conversationId: z.string(),
      }),
    },
  },

  states: {
    userInfo: {
      type: 'user',
      schema: z.object({
        email: z.string(),
        chatwootContactId: z.string(),
      }),
    },
  },

  channels: {
    hitl: {
      conversation: {
        tags: {
          id: { title: 'Chatwoot Conversation ID', description: 'The ID of the conversation in Chatwoot' },
          bpUserId: { title: 'Botpress User ID', description: 'The Botpress user ID' },
        },
      },
      messages: {
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
        image: {
          schema: z.object({
            imageUrl: z.string(),
          }),
        },
        file: {
          schema: z.object({
            fileUrl: z.string(),
            title: z.string().optional(),
          }),
        },
        video: {
          schema: z.object({
            videoUrl: z.string(),
            title: z.string().optional(),
          }),
        },
        choice: {
          schema: z.object({
            text: z.string(),
            options: z.array(z.object({ label: z.string(), value: z.string() })),
          }),
        },
      },
      message: {
        tags: {
          id: {},
          conversationId: {},
        },
      },
    },

    channel: {
      title: 'Chatwoot Messaging Channel',
      description: 'Direct messaging channel for bot conversations',
      conversation: {
        tags: {
          id: { title: 'Chatwoot Conversation ID' },
        },
      },
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
        file: { schema: z.object({ fileUrl: z.string(), title: z.string().optional() }) },
        video: { schema: z.object({ videoUrl: z.string(), title: z.string().optional() }) },
        choice: {
          schema: z.object({
            text: z.string(),
            options: z.array(z.object({ label: z.string(), value: z.string() })),
          }),
        },
      },
      message: {
        tags: {
          id: {},
          conversationId: {},
        },
      },
    },
  },

  user: {
    tags: {
      email: { title: 'User Email' },
      chatwootAgentId: { title: 'Chatwoot Agent ID' },
      chatwootContactId: { title: 'Chatwoot Contact ID' },
    },
  },

  entities: {
    ticket: {
      title: 'Ticket',
      description: 'A HITL ticket/session',
      schema: z.object({}),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: 'Chatwoot HITL',
      description: 'Chatwoot HITL channel for human handoff',
    },
  },
}))
