import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    messages: {
      ...messages.defaults,
      markdown: messages.markdown,
    },
  },
} satisfies IntegrationDefinitionProps['channels']
