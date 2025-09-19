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
  addReactions: {
    //   title: 'Add Reaction',
    //   description: 'Add a reaction to a message in a Teams conversation.',
    title: 'Add Reactions',
    description: 'Add one or more reactions (up to 20) to a chat message',
    input: {
      schema: sdk.z.object({
        conversationId: sdk.z
          .string()
          .title('Botpress Conversation ID')
          .describe('The ID of any Botpress conversation from channel "Teams", eg: "conv_01JZ..."'),
        emoji: sdk.z.string().title('Reaction Emoji').describe('The emoji that will be used to react to a message'),
        teamsUserId: sdk.z
          .string()
          .title('Teams User ID')
          .describe('The ID of any Teams user from tenant to initiate the conversation with, eg: "29:2d5f3..."')
          .optional(),
        teamsMessageId: sdk.z
          .string()
          .title('Teams Message ID')
          .describe('The ID of the message that the reaction(s) will be applied to'),
        // TODO: Possibly needs a conversationId
        // TODO: Add emoji code
      }),
    },
    output: {
      schema: sdk.z.object({}),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
