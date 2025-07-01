import * as sdk from '@botpress/sdk'

export const actions = {
  startDmConversation: {
    title: 'Start DM Conversation',
    description: 'Initiate a conversation with a user in a DM',
    input: {
      schema: sdk.z.object({
        teamsUserId: sdk.z
          .string()
          .title('Teams User ID')
          .describe('The ID of any Teams user from tenant to initiate the conversation with, eg: "29:2d5f3..."'),
        conversationId: sdk.z
          .string()
          .title('Botpress Conversation ID')
          .describe('The ID of any Botpress conversation from channel "Teams", eg: "conv_01JZ..."'),
      }),
    },
    output: {
      schema: sdk.z.object({
        userId: sdk.z.string().title('User ID').describe('The ID of the user'),
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the new conversation'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
