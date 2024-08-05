import { IntegrationDefinitionProps, messages, z } from '@botpress/sdk'

export const channels = {
  ticket: {
    title: 'Zendesk Ticket',
    messages: {
      text: {
        schema: messages.defaults.text.schema.extend({
          userId: z.string().optional().describe('Allows sending a message pretending to be a certain user'),
        }),
      },
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
        requesterId: {
          title: 'Zendesk Requester ID',
        },
      },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
