import { create as createMessengerClient } from './messenger-client'
import { MessengerMessage } from './types'
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

  if (!user.name || !user.pictureUrl) {
    try {
      const messengerClient = await createMessengerClient(client, ctx)
      const profile = await messengerClient.getUserProfile(message.sender.id, { fields: ['id', 'name', 'profile_pic'] })
      logger.forBot().debug('Fetched latest Messenger user profile: ', profile)

      await client.updateUser({ id: user.id, name: profile.name, pictureUrl: profile.profilePic })
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
