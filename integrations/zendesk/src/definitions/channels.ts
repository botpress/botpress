import { IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  ticket: {
    title: 'Zendesk Ticket',
    messages: {}, // defined by the HITL interface
    message: {
      tags: {
        id: {},
        origin: {
          title: 'zendesk or botpress',
          description: 'The origin of the message',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Zendesk Ticket ID',
        },
        requesterId: {
          title: 'Zendesk Requester ID',
        },
      },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
