import { MessengerMessage } from './types'
import { getMessengerClient } from './utils'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

export async function handleMessage(
  message: MessengerMessage,
  { client, ctx, logger }: { client: bp.Client; ctx: bp.Context; logger: IntegrationLogger }
) {
  const { sender, recipient, message: textMessage, postback } = message

  let text: string
  let messageId: string

  if (textMessage?.text) {
    text = textMessage.text
    messageId = textMessage.mid
    logger.forBot().debug(`Received text message from Messenger: ${textMessage.text}`)
  } else if (postback?.payload) {
    text = postback.payload
    messageId = postback.mid
    logger.forBot().debug(`Received postback from Messenger: ${postback.title}`)
  } else {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: sender.id,
      senderId: sender.id,
      recipientId: recipient.id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: sender.id,
    },
  })

  // TODO: do this for profile_pic as well, as of 13 NOV 2023 the url "https://platform-lookaside.fbsbx.com/platform/profilepic?eai=<eai>&psid=<psid>&width=<width>&ext=<ext>&hash=<hash>" is not working
  if (!user.name) {
    try {
      const messengerClient = await getMessengerClient(client, ctx)
      const profile = await messengerClient.getUserProfile(message.sender.id, { fields: ['id', 'name'] })
      logger.forBot().debug('Fetched latest Messenger user profile: ', profile)

      await client.updateUser({ ...user, name: profile.name })
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Messenger:', error)
    }
  }

  await client.createMessage({
    tags: {
      id: messageId,
      senderId: message.sender.id,
      recipientId: message.recipient.id,
    },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text },
  })
}
