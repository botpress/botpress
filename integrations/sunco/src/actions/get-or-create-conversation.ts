import { createClient } from 'src/api/sunshine-api'
import { getStoredCredentials } from 'src/get-stored-credentials'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  input,
  ctx,
}) => {
  const credentials = await getStoredCredentials(client, ctx)
  const suncoClient = createClient(credentials)
  const suncoConversation = await suncoClient.conversations.getConversation(credentials.appId, input.conversation.id)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: `${suncoConversation.conversation?.id}` },
  })

  return {
    conversationId: conversation.id,
  }
}
