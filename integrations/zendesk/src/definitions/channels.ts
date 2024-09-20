import { IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Zendesk Ticket',
    messages: {}, // defined by the integration
    conversation: {
      tags: {
        id: {
          title: 'Zendesk Ticket ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
