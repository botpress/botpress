import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    messages: { ...messages.defaults },
    message: { tags: { id: {} } },
    conversation: {
      tags: { id: {} },
      creation: { enabled: true, requiredTags: ['id'] },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
