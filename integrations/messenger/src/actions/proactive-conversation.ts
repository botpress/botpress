import { RuntimeError } from '@botpress/sdk'
import { create as createMessengerClient } from '../misc/messenger-client'
import { tryGetUserProfile } from '../misc/utils'
import * as bp from '.botpress'

const getOrCreateConversation: bp.IntegrationProps['actions']['getOrCreateConversation'] = async ({
  client,
  ctx,
  input,
}) => {
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Starting a conversation is not supported in sandbox mode')
  }

  const userId = input.conversation.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const messengerClient = await createMessengerClient(client, ctx)
  const profile = await tryGetUserProfile(messengerClient, ctx, userId)
  if (!profile) {
    throw new RuntimeError(
      'Could not fetch user profile from Messenger, make sure you are using a configuration with the necessary permissions or enable the "Get user profile" option.'
    )
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: profile.id },
  })

  return {
    conversationId: conversation.id,
  }
}

export default getOrCreateConversation
