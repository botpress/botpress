import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async (args) => {
  const { client, input } = args

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
