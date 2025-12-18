import * as sdk from '@botpress/sdk'

export const actions = {
  startDmConversationFromComment: {
    title: 'Start DM Conversation from Comment',
    description: 'Start a DM conversation from a comment',
    input: {
      schema: sdk.z.object({
        commentId: sdk.z.string().title('Comment ID').describe('The ID of the comment to start the conversation from'),
        message: sdk.z.string().title('Message').describe('The message to send to the user'),
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
