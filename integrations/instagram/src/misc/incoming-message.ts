import { getCredentials, MetaClient } from './client'
import { InstagramMessage, IntegrationLogger } from './types'
import * as bp from '.botpress'

export async function handleMessage(
  message: InstagramMessage,
  { client, ctx, logger }: { client: bp.Client; ctx: bp.Context; logger: IntegrationLogger }
) {
  if (message?.message?.text) {
    logger.forBot().debug('Received text message from Instagram:', message.message.text)
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: message.sender.id,
        senderId: message.sender.id,
        recipientId: message.recipient.id,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        id: message.sender.id,
      },
    })

    if (!user.name || !user.pictureUrl) {
      try {
        const { accessToken } = await getCredentials(client, ctx)
        const metaClient = new MetaClient(logger, { accessToken })
        const userProfile = await metaClient.getUserProfile(message.sender.id, ['profile_pic'])

        logger.forBot().debug('Fetched latest Instagram user profile: ', userProfile)

        if (userProfile?.name) {
          await client.updateUser({ ...user, name: userProfile?.name, pictureUrl: userProfile?.profile_pic })
        }
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Instagram', error)
      }
    }

    console.log('Will Create Message', { message, user, conversation })

    await client.createMessage({
      type: 'text',
      tags: {
        id: message.message.mid,
        senderId: message.sender.id,
        recipientId: message.recipient.id,
      },
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: message.message.text },
    })
  }
}
