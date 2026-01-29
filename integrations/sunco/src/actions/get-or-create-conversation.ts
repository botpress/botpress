import { createClient } from '../api/sunshine-api'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  input,
  ctx,
}) => {
  const suncoClient = createClient(ctx.configuration.keyId, ctx.configuration.keySecret)
  const suncoConversation = await suncoClient.conversations.getConversation(
    ctx.configuration.appId,
    input.conversation.id
  )

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: `${suncoConversation.conversation?.id}` },
  })

  return {
    conversationId: conversation.id,
  }
}
