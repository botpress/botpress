import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (props) => {
  const { client, ctx, input } = props
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const commentId = input.conversation.commentId
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: input.conversation.userId, commentId },
    discriminateByTags: ['id'],
  })

  if (commentId) {
    await client.getOrSetState({
      type: 'conversation',
      name: 'privateReply',
      id: conversation.id,
      payload: { initiateNew: true },
    })
  }

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation
