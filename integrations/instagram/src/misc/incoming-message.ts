import { IntegrationContext } from '@botpress/sdk'
import { idTag } from 'src/const'
import { InstagramMessage, InstagramUserProfile, IntegrationLogger } from './types'
import { getMessengerClient } from './utils'
import * as bp from '.botpress'

export async function handleMessage(
  message: InstagramMessage,
  {
    client,
    ctx,
    logger,
  }: { client: bp.Client; ctx: IntegrationContext<bp.configuration.Configuration>; logger: IntegrationLogger }
) {
  if (message?.message?.text) {
    logger.forBot().debug('Received text message from Instagram:', message.message.text)
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        [idTag]: message.sender.id,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        [idTag]: message.sender.id,
      },
    })

    if (!user.pictureUrl || !user.name) {
      try {
        const messengerClient = getMessengerClient(ctx.configuration)
        const userProfile = (await messengerClient.getUserProfile(message.sender.id, {
          // username is an available field for instagram ids -> https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-profiles-and-media
          fields: ['id', 'name', 'profile_pic', 'username'] as any,
        })) as InstagramUserProfile

        logger.forBot().debug('Fetched latest Instagram user profile: ', userProfile)

        const fieldsToUpdate = {
          pictureUrl: userProfile?.profilePic,
          name: userProfile?.name || userProfile?.username,
        }
        if (fieldsToUpdate.pictureUrl || fieldsToUpdate.name) {
          await client.updateUser({ ...user, ...fieldsToUpdate })
        }
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Instagram', error)
      }
    }

    await client.createMessage({
      type: 'text',
      tags: {
        // TODO: declare in definition
        // [idTag]: message.message.mid
      },
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: message.message.text },
    })
  }
}
