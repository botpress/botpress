import { getCredentials, InstagramClient } from 'src/misc/client'
import {
  InstagramMessaging,
  InstagramMessagingItem,
  InstagramMessagingItemMessage,
  InstagramMessagingItemPostback,
} from 'src/misc/types'
import * as bp from '.botpress'

type IncomingMessageTypes = keyof Pick<bp.channels.channel.Messages, 'audio' | 'image' | 'text' | 'video' | 'bloc'>
type IncomingMessages = {
  [TMessage in IncomingMessageTypes]: {
    type: TMessage
    payload: bp.channels.channel.Messages[TMessage]
  }
}
type IncomingMessage = IncomingMessages[IncomingMessageTypes]

// Entry-level handler for single message entry
export const messagingHandler = async (messaging: InstagramMessaging, props: bp.HandlerProps) => {
  for (const messagingItem of messaging) {
    if ('message' in messagingItem) {
      await _messageHandler(messagingItem, props)
    }
    if ('postback' in messagingItem) {
      await _postbackHandler(messagingItem, props)
    }
  }
}

const _decodePostbackPayload = (payload: string): string => {
  const VALID_PREFIXES = ['postback', 'say']
  const prefix = payload.split(':')[0]
  if (!prefix || !VALID_PREFIXES.includes(prefix)) {
    return payload
  }
  return payload.slice(prefix.length + 1).trim()
}

const _postbackHandler = async (messagingItem: InstagramMessagingItemPostback, handlerProps: bp.HandlerProps) => {
  const { postback } = messagingItem
  handlerProps.logger.forBot().debug('Received postback from Instagram:', postback.payload)
  const decodedPayload = _decodePostbackPayload(postback.payload)
  await _commonMessagingHandler({
    incomingMessage: { type: 'text', payload: { text: decodedPayload } },
    mid: postback.mid,
    messagingItem,
    handlerProps,
  })
}

const _messageHandler = async (messagingItem: InstagramMessagingItemMessage, handlerProps: bp.HandlerProps) => {
  const { message } = messagingItem
  if (message.is_echo) {
    return
  }
  handlerProps.logger
    .forBot()
    .debug(
      `Received message from Instagram: text=${message.text ?? '[None]'}, attachments=[${message.attachments?.map((a) => `${a.type}:${a.payload.url}`).join(', ') ?? 'None'}]`
    )

  const incomingMessages: IncomingMessage[] = []
  const { text, attachments } = message
  if (text) {
    incomingMessages.push({ type: 'text', payload: { text } })
  }
  if (attachments) {
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        incomingMessages.push({ type: 'image', payload: { imageUrl: attachment.payload.url } })
      } else if (attachment.type === 'video') {
        incomingMessages.push({ type: 'video', payload: { videoUrl: attachment.payload.url } })
      } else if (attachment.type === 'audio') {
        incomingMessages.push({ type: 'audio', payload: { audioUrl: attachment.payload.url } })
      } else {
        handlerProps.logger.forBot().warn(`Unsupported attachment type in incoming message: ${attachment.type}`)
      }
    }
  }

  let incomingMessage: IncomingMessage | undefined
  if (incomingMessages.length > 1) {
    const items = incomingMessages.filter((m) => m.type !== 'bloc')
    incomingMessage = {
      type: 'bloc',
      payload: {
        items,
      },
    }
  } else {
    incomingMessage = incomingMessages[0]
  }

  if (!incomingMessage) {
    handlerProps.logger.forBot().debug('No incoming message to process')
    return
  }
  await _commonMessagingHandler({
    incomingMessage,
    mid: message.mid,
    messagingItem,
    handlerProps,
  })
}

const _commonMessagingHandler = async ({
  incomingMessage: { type, payload },
  mid,
  messagingItem,
  handlerProps,
}: {
  incomingMessage: IncomingMessage
  mid: string
  messagingItem: InstagramMessagingItem
  handlerProps: bp.HandlerProps
}) => {
  const { client, ctx, logger } = handlerProps

  const { sender, recipient } = messagingItem
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: sender.id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: sender.id,
    },
  })

  if (!user.name || !user.pictureUrl) {
    try {
      const { accessToken } = await getCredentials(client, ctx)
      const instagramClient = new InstagramClient(logger, { accessToken })
      const userProfile = await instagramClient.getUserProfile(sender.id, ['profile_pic'])

      logger.forBot().debug('Fetched latest Instagram user profile: ', userProfile)

      if (userProfile?.name || userProfile?.profile_pic) {
        await client.updateUser({ id: user.id, name: userProfile?.name, pictureUrl: userProfile?.profile_pic })
      }
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Instagram', error)
    }
  }

  await client.getOrCreateMessage({
    type,
    tags: {
      id: mid,
      senderId: sender.id,
      recipientId: recipient.id,
    },
    userId: user.id,
    conversationId: conversation.id,
    payload,
  })
}
