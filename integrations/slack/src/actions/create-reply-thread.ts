import { wrapActionAndInjectSlackClient } from './action-wrapper'

export const createReplyThread = wrapActionAndInjectSlackClient(
  { actionName: 'createReplyThread', errorMessage: 'Failed to create reply thread' },
  async ({ client }, input) => {
    const parentMessage = input.parentMessage

    const { conversation: newThread } = await client.getOrCreateConversation({
      channel: 'thread',
      tags: {
        id: parentMessage.tags.channelId,
        thread: parentMessage.tags.ts,
      },
    })

    // Push the original message to the new thread so that the bot can reply to it:
    await client.createMessage({
      type: parentMessage.type as any,
      payload: parentMessage.payload as any,
      tags: { ...parentMessage.tags, isBotReplyThread: 'true' },
      userId: input.messageAuthor.id,
      conversationId: newThread.id,
    })

    return { threadConversationId: newThread.id }
  }
)
