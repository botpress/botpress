import * as sdk from '@botpress/sdk'

export const channels = {
  channel: {
    messages: sdk.messages.defaults,
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        id: {},
        email: {},
        subject: {},
        references: {},
        cc: {},
      },
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
