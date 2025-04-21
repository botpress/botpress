import * as sdk from '@botpress/sdk'

const ALL_MESSAGE_TYPES = Object.fromEntries(
  Object.entries(sdk.messages.defaults).map(([msgType, definition]) => [
    msgType,
    {
      ...definition,
      schema: () => definition.schema,
    },
  ])
)

export default new sdk.InterfaceDefinition({
  name: 'threaded-responses',
  version: '0.1.0',
  channels: {
    groupChat: {
      messages: ALL_MESSAGE_TYPES,
    },
    groupChatThread: {
      messages: ALL_MESSAGE_TYPES,
    },
  },
  actions: {
    createReplyThread: {
      title: 'Create a reply thread',
      description: 'Create a reply thread for a group chat message',
      input: {
        schema: () =>
          sdk.z.object({
            parentMessage: sdk.z
              .object({
                id: sdk.z.string().title('Message ID').describe('The ID of the message to reply to.'),
                type: sdk.z.string().title('Message type').describe('The type of the message to reply to.'),
                payload: sdk.z
                  .record(sdk.z.any())
                  .title('Message payload')
                  .describe('The payload of the message to reply to.'),
                tags: sdk.z
                  .record(sdk.z.string())
                  .title('Message tags')
                  .describe('The tags of the message to reply to.'),
              })
              .passthrough()
              .title('Parent message')
              .describe(
                'The message to reply to. The group chat will be forked at this point and a new thread will be created.'
              ),
            parentConversation: sdk.z
              .object({
                id: sdk.z.string().title('Conversation ID').describe('The ID of the conversation.'),
                tags: sdk.z.record(sdk.z.string()).title('Conversation tags').describe('The tags of the conversation.'),
              })
              .passthrough()
              .title('Parent conversation')
              .describe(
                'The conversation that contains the message to reply to. This is usually the ID of the group chat.'
              ),
            messageAuthor: sdk.z
              .object({
                id: sdk.z.string().title('Message author ID').describe('The ID of the user who sent the message.'),
                tags: sdk.z
                  .record(sdk.z.string())
                  .title('Message author tags')
                  .describe('The tags of the user who sent the message.'),
              })
              .passthrough()
              .title('Message author')
              .describe('The user who sent the message to reply to.'),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            threadConversationId: sdk.z
              .string()
              .title('Thread conversation ID')
              .describe('The ID of the new conversation.'),
          }),
      },
    },
  },
})
