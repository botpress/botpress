import { create as createMessengerClient } from '../../misc/messenger-client'
import { MessengerMessaging } from '../../misc/types'
import * as bp from '.botpress'

type User = Awaited<ReturnType<bp.Client['getOrCreateUser']>>['user']

export async function handler(message: MessengerMessaging, props: bp.HandlerProps) {
  const { client, logger } = props
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
  await _updateUserProfile(user, sender.id, props)

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

const _shouldGetUserProfile = (props: bp.HandlerProps) => {
  const { ctx } = props
  if (ctx.configurationType === 'sandbox') {
    return bp.secrets.SANDBOX_SHOULD_GET_USER_PROFILE === 'true'
  }
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.shouldGetUserProfile ?? true
  }

  return bp.secrets.SHOULD_GET_USER_PROFILE === 'true'
}

const _updateUserProfile = async (user: User, messengerUserId: string, props: bp.HandlerProps) => {
  const { client, ctx, logger } = props
  if (_shouldGetUserProfile(props) && (!user.name || !user.pictureUrl)) {
    try {
      const messengerClient = await createMessengerClient(client, ctx)
      const profile = await messengerClient.getUserProfile(messengerUserId, { fields: ['id', 'name', 'profile_pic'] })
      logger.forBot().debug('Fetched latest Messenger user profile: ', profile)

      await client.updateUser({ id: user.id, name: profile.name, pictureUrl: profile.profilePic })
    } catch (error: any) {
      logger
        .forBot()
        .error(
          'Error while fetching user profile from Messenger, make sure your app was granted the necessary permissions. Error:',
          error?.message ?? '[Unknown error]'
        )
    }
  }
}
