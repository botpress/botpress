import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Amazon Connect Chat',
    description: 'Chat channel for Amazon Connect conversations',
    messages: messages.defaults,
    message: {
      tags: {
        id: {
          title: 'Message ID',
          description: 'Amazon Connect message ID',
        },
        timestamp: {
          title: 'Timestamp',
          description: 'Message timestamp',
        },
        type: {
          title: 'Message Type',
          description: 'Amazon Connect message type (MESSAGE, EVENT, ATTACHMENT)',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Contact ID',
          description: 'Amazon Connect contact ID',
        },
        connectionToken: {
          title: 'Connection Token',
          description: 'Participant connection token',
        },
        participantId: {
          title: 'Participant ID',
          description: 'Bot participant ID',
        },
        initialContactId: {
          title: 'Initial Contact ID',
          description: 'Initial contact ID before HITL transfer',
        },
      },
    },
  },
  hitl: {
    title: 'HITL Channel',
    description: 'Channel for human agent conversations',
    messages: messages.defaults,
    message: {
      tags: {
        id: {
          title: 'Message ID',
          description: 'Amazon Connect message ID',
        },
        timestamp: {
          title: 'Timestamp',
          description: 'Message timestamp',
        },
        type: {
          title: 'Message Type',
          description: 'Amazon Connect message type',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Contact ID',
          description: 'Amazon Connect contact ID for HITL session',
        },
        connectionToken: {
          title: 'Connection Token',
          description: 'Participant connection token',
        },
        participantId: {
          title: 'Participant ID',
          description: 'Bot participant ID in HITL session',
        },
        initialContactId: {
          title: 'Initial Contact ID',
          description: 'Original contact ID before HITL',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
