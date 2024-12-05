import { IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Freshchat',
    description: 'Freshchat HITL',
    messages: {}, // defined by the interface
    conversation: {
      tags: {
        id: { title: 'Freshchat Conversation Id', description: 'Freshchat Conversation Id' },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
