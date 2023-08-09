import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  ticket: {
    title: 'Zendesk Ticket',
    messages: {
      text: messages.defaults.text,
    },
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
        authorId: {},
      },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
