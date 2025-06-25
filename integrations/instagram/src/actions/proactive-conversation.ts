import { RuntimeError } from '@botpress/sdk'
import { getCredentials, InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const getOrCreateConversationDm: bp.IntegrationProps['actions']['getOrCreateConversationDm'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const credentials = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, credentials)
  const profile = await metaClient.getUserProfile(input.conversation.id)
  const { conversation } = await client.getOrCreateConversation({ channel: 'channel', tags: { id: profile.id } })
  return { conversationId: conversation.id }
}
