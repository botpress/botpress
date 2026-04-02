import { getSuncoClient } from 'src/client'
import { getStoredCredentials } from 'src/get-stored-credentials'
import * as bp from '.botpress'

export const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  input,
  ctx,
}) => {
  const credentials = await getStoredCredentials(client, ctx)
  const suncoConversation = await getSuncoClient(credentials).getConversation(input.conversation.id)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: `${suncoConversation.conversation?.id}` },
  })

  return {
    conversationId: conversation.id,
  }
}
