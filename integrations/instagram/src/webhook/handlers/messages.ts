import { getCredentials, InstagramClient } from 'src/misc/client'
import {
  InstagramMessagingEntry,
  InstagramMessagingEntryMessage,
  InstagramMessagingEntryPostback,
  InstagramPayloadSchema,
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

export const messagingHandler = async (props: bp.HandlerProps) => {
  const { logger, req } = props
  if (!req.body) {
    logger.debug('Handler received an empty body, so the message was ignored')
    return
  }

  const parseResult = InstagramPayloadSchema.safeParse(JSON.parse(req.body))
  if (!parseResult.success) {
    logger.error('Received invalid or unsupported Instagram payload', parseResult.error.message)
    return { status: 400, body: 'Invalid payload' }
  }

  for (const { messaging } of parseResult.data.entry) {
    for (const messagingEntry of messaging) {
      if ('message' in messagingEntry) {
        await _messageHandler(messagingEntry, props)
      }
      if ('postback' in messagingEntry) {
        await _postbackHandler(messagingEntry, props)
      }
    }
  }
  return { status: 200 }
}

const _decodePostbackPayload = (payload: string): string => {
  const VALID_PREFIXES = ['postback', 'say']
  const prefix = payload.split(':')[0]
  if (!prefix || !VALID_PREFIXES.includes(prefix)) {
    return payload
  }
  return payload.slice(prefix.length + 1).trim()
}

const _postbackHandler = async (messagingEntry: InstagramMessagingEntryPostback, handlerProps: bp.HandlerProps) => {
  const { postback } = messagingEntry
  handlerProps.logger.forBot().debug('Received postback from Instagram:', postback.payload)
  const decodedPayload = _decodePostbackPayload(postback.payload)
  await _commonMessagingHandler({
    incomingMessage: { type: 'text', payload: { text: decodedPayload } },
    mid: postback.mid,
    messagingEntry,
    handlerProps,
  })
}

const _messageHandler = async (messagingEntry: InstagramMessagingEntryMessage, handlerProps: bp.HandlerProps) => {
  const { message } = messagingEntry
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
    messagingEntry,
    handlerProps,
  })
}

const _commonMessagingHandler = async ({
  incomingMessage: { type, payload },
  mid,
  messagingEntry,
  handlerProps,
}: {
  incomingMessage: IncomingMessage
  mid: string
  messagingEntry: InstagramMessagingEntry
  handlerProps: bp.HandlerProps
}) => {
  const { client, ctx, logger } = handlerProps

  const { sender, recipient } = messagingEntry
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
      const metaClient = new InstagramClient(logger, { accessToken })
      const userProfile = await metaClient.getUserProfile(sender.id, ['profile_pic'])

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
