import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    messages: { ...messages.defaults },
  },
} satisfies IntegrationDefinitionProps['channels']
