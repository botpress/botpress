import * as sdk from '@botpress/sdk'

export const channels = {
  comments: {
    title: 'Page comments',
    description: 'Comment thread on a page',
    messages: {
      text: sdk.messages.defaults.text,
    },
    conversation: {
      tags: {
        id: {
          title: 'Task ID',
          description: 'The ID of the task',
        },
      },
    },
    message: {
      tags: {
        id: {
          title: 'Page ID',
          description: 'The ID of the page',
        },
      },
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
