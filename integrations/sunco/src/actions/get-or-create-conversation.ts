import { getStoredCredentials } from 'src/get-stored-credentials'
import { createClient } from '../api/sunshine-api'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  input,
  ctx,
}) => {
  const { token, appId } = await getStoredCredentials(client, ctx.integrationId)
  const suncoClient = createClient(token)
  const suncoConversation = await suncoClient.conversations.getConversation(appId, input.conversation.id)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: `${suncoConversation.conversation?.id}` },
  })

  return {
    conversationId: conversation.id,
  }
}
