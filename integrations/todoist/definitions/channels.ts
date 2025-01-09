import * as sdk from '@botpress/sdk'

export const channels = {
  comments: {
    title: 'Task comments',
    description: 'Comment thread on a task',
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
          title: 'Comment ID',
          description: 'The ID of the comment',
        },
      },
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
