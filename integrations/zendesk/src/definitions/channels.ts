import { IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Zendesk Ticket',
    messages: {}, // defined by the interface
    conversation: {
      tags: {
        id: {
          title: 'Zendesk Ticket ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
