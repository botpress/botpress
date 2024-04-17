import { IntegrationProps } from '.botpress'

export const getConversationFromSession: IntegrationProps['actions']['getConversationFromSession'] = async ({ input, client }) => {

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      pollingKey: input.session.pollingKey
    }
  })

  return { conversationId: conversation.id }
}
