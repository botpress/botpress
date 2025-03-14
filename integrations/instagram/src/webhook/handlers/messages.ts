import { getCredentials, InstagramClient } from 'src/misc/client'
import { InstagramMessage, InstagramPayload } from 'src/misc/types'
import * as bp from '.botpress'

export const messagesHandler = async (props: bp.HandlerProps) => {
  const { logger, req } = props
  if (!req.body) {
    logger.debug('Handler received an empty body, so the message was ignored')
    return
  }

  const data = JSON.parse(req.body) as InstagramPayload

  for (const { messaging } of data.entry) {
    for (const message of messaging) {
      if (message.message?.is_echo) {
        continue
      }
      await _handleMessage(message, props)
    }
  }
}

async function _handleMessage(message: InstagramMessage, { client, ctx, logger }: bp.HandlerProps) {
  if (message?.message?.text) {
    logger.forBot().debug('Received text message from Instagram:', message.message.text)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: message.sender.id,
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
        const metaClient = new InstagramClient(logger, { accessToken })
        const userProfile = await metaClient.getUserProfile(message.sender.id, ['profile_pic'])

        logger.forBot().debug('Fetched latest Instagram user profile: ', userProfile)

        if (userProfile?.name) {
          await client.updateUser({ ...user, name: userProfile?.name, pictureUrl: userProfile?.profile_pic })
        }
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Instagram', error)
      }
    }

    await client.getOrCreateMessage({
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
