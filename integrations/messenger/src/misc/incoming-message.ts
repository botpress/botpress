import { IntegrationContext } from '@botpress/sdk'
import { MessengerMessage } from './types'
import { getMessengerClient } from './utils'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

export async function handleMessage(
  message: MessengerMessage,
  {
    client,
    ctx,
    logger,
  }: { client: bp.Client; ctx: IntegrationContext<bp.configuration.Configuration>; logger: IntegrationLogger }
) {
  if (message?.message?.text) {
    logger.forBot().debug('Received text message from Messenger:', message.message.text)
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

    // TODO: do this for profile_pic as well, as of 13 NOV 2023 the url "https://platform-lookaside.fbsbx.com/platform/profilepic?eai=<eai>&psid=<psid>&width=<width>&ext=<ext>&hash=<hash>" is not working
    if (!user.name) {
      try {
        const messengerClient = getMessengerClient(ctx.configuration)
        const profile = await messengerClient.getUserProfile(message.sender.id, { fields: ['id', 'name'] })
        logger.forBot().debug('Fetched latest Messenger user profile: ', profile)

        await client.updateUser({ ...user, name: profile.name })
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Messenger:', error)
      }
    }

    await client.createMessage({
      tags: {
        id: message.message.mid,
        senderId: message.sender.id,
        recipientId: message.recipient.id,
      },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: message.message.text },
    })
  }
}
