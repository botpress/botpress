import { IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Freshchat',
    messages: {}, // defined by the integration
    conversation: {
      tags: {
        id: { title: 'Freshchat Conversation Id', description: 'Freshchat Conversation Id' },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
