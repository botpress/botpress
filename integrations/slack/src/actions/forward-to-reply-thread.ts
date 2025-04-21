import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const forwardToReplyThread = wrapActionAndInjectSlackClient(
  { actionName: 'forwardToReplyThread', errorMessage: 'Failed to create reply thread' },
  async ({ client }, input) => {
    const parentMessage = input.parentMessage

    const { conversation: newThread } = await client.getOrCreateConversation({
      channel: 'thread',
      tags: {
        id: parentMessage.tags.channelId,
        thread: parentMessage.tags.ts,
        isBotReplyThread: 'true',
      },
      discriminateByTags: ['id', 'thread'],
    })

    // Push the original message to the new thread so that the bot can reply to it:
    await client.createMessage({
      type: parentMessage.type as any,
      payload: parentMessage.payload as any,
      tags: { ...parentMessage.tags },
      userId: parentMessage.userId,
      conversationId: newThread.id,
    })

    return { threadConversationId: newThread.id }
  }
)
