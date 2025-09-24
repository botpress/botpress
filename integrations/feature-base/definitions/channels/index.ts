import * as sdk from '@botpress/sdk'

export const comments = {
  title: 'Comments',
  description: 'Comment section of a post',
  messages: {
    text: sdk.messages.defaults.text,
  },
  message: {
    tags: {
      id: {
        title: 'ID',
        description: 'The Feature Base ID of the comment',
      },
    },
  },
  conversation: {
    tags: {
      rootCommentId: {
        title: 'Root Comment ID',
        description: 'The Feature Base ID of the root comment of the reply chain',
      },
      submissionId: {
        title: 'Submission ID',
        description: 'The Feature Base ID of the submission (post) where the comment was posted',
      },
    },
  },
} satisfies sdk.ChannelDefinition
