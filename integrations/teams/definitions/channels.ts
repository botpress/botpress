import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Channel',
    description: 'Teams conversation channel',
    messages: messages.defaults,
    message: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams activity ID',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams conversation ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
