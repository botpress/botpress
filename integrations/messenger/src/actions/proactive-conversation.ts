import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (props) => {
  const { client, ctx, input } = props
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const { userId, commentId } = input.conversation
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: userId, commentId },
    discriminateByTags: ['id'],
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation
