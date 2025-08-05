import * as sdk from '@botpress/sdk'

export const actions = {
  startDmConversation: {
    title: 'Start DM Conversation',
    description: 'Initiate a conversation with a user in a DM by email or user ID.',
    input: {
      schema: sdk.z.object({
        teamsUserId: sdk.z
          .string()
          .title('Teams User ID')
          .describe('The ID of any Teams user from tenant to initiate the conversation with, eg: "29:2d5f3..."')
          .optional(),
        teamsUserEmail: sdk.z
          .string()
          .title('Teams User Email')
          .describe('The Email of any Teams user from tenant to initiate the conversation with')
          .optional(),
        conversationId: sdk.z
          .string()
          .title('Botpress Conversation ID')
          .describe('The ID of any Botpress conversation from channel "Teams", eg: "conv_01JZ..."'),
      }),
    },
    output: {
      schema: sdk.z.object({
        userId: sdk.z.string().title('User ID').describe('The ID of the user').optional(),
        conversationId: sdk.z.string().title('Conversation ID').describe('The ID of the new conversation'),
      }),
    },
  },
  addReaction: {
    title: 'Add Reaction',
    description: 'Add a reaction to a message in a Teams conversation.',
    input: {
      schema: sdk.z.object({
        teamsUserId: sdk.z
          .string()
          .title('Teams User ID')
          .describe('The ID of any Teams user from tenant to initiate the conversation with, eg: "29:2d5f3..."')
          .optional(),
        teamsMessageId: sdk.z.string().title('Teams Message ID'),
        // TODO: Possibly needs a conversationId
        // TODO: Add emoji code
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
