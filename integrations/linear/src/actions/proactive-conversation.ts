import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (args) => {
  const { client, ctx, input } = args

  const { conversation } = await client.getOrCreateConversation({
    channel: 'issue',
    tags: {
      id: input.conversation.id,
    },
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation
