import { IntegrationDefinitionProps, messages } from '@botpress/sdk'
const { text } = messages.defaults

export const channels = {
  pullRequest: {
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        number: {},
      },
    },
    messages: {
      text,
    },
  },
  discussion: {
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        number: {},
      },
    },
    messages: {
      text,
    },
  },
  issue: {
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        number: {},
      },
    },
    messages: {
      text,
    },
  },
} satisfies IntegrationDefinitionProps['channels']
