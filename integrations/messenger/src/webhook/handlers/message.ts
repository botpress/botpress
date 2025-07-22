import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { create as createMessengerClient } from '../../misc/messenger-client'
import {
  MessengerMessagingEntry,
  MessengerMessagingEntryMessage,
  MessengerMessagingEntryPostback,
} from '../../misc/types'
import { FileMetadata, generateIdFromUrl, getMediaMetadata } from '../../misc/utils'
import * as bp from '.botpress'

type IncomingMessageTypes = keyof Pick<bp.channels.channel.Messages, 'audio' | 'image' | 'text' | 'video' | 'bloc'>
type IncomingMessages = {
  [TMessage in IncomingMessageTypes]: {
    type: TMessage
    payload: bp.channels.channel.Messages[TMessage]
  }
}
type IncomingMessage = IncomingMessages[IncomingMessageTypes]

export const handler = async (messagingEntry: MessengerMessagingEntry, props: bp.HandlerProps) => {
  if ('message' in messagingEntry) {
    await _messageHandler(messagingEntry, props)
  }
  if ('postback' in messagingEntry) {
    await _postbackHandler(messagingEntry, props)
  }
}

const _messageHandler = async (messagingEntry: MessengerMessagingEntryMessage, handlerProps: bp.HandlerProps) => {
  const { message } = messagingEntry
  const { client, ctx, logger } = handlerProps
  logger
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
      const { url } = await _getOrDownloadMedia(attachment.payload.url, client, ctx)
      if (attachment.type === 'image') {
        incomingMessages.push({ type: 'image', payload: { imageUrl: url } })
      } else if (attachment.type === 'video') {
        incomingMessages.push({ type: 'video', payload: { videoUrl: url } })
      } else if (attachment.type === 'audio') {
        incomingMessages.push({ type: 'audio', payload: { audioUrl: url } })
      } else {
        logger.forBot().warn(`Unsupported attachment type in incoming message: ${attachment.type}`)
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
    logger.forBot().debug('No incoming message to process')
    return
  }
  await _commonMessagingHandler({
    incomingMessage,
    mid: message.mid,
    messagingEntry,
    handlerProps,
  })
}

const _postbackHandler = async (messagingEntry: MessengerMessagingEntryPostback, handlerProps: bp.HandlerProps) => {
  const { postback } = messagingEntry
  handlerProps.logger
    .forBot()
    .debug(`Received postback from Messenger: label=${postback.title}, value=${postback.payload}`)
  await _commonMessagingHandler({
    incomingMessage: { type: 'text', payload: { text: postback.payload } },
    mid: postback.mid,
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
  messagingEntry: MessengerMessagingEntry
  handlerProps: bp.HandlerProps
}) => {
  const { client, ctx, logger } = handlerProps

  const { sender, recipient } = messagingEntry
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: sender.id, senderId: sender.id, recipientId: recipient.id },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: sender.id,
    },
  })

  if (!user.name || !user.pictureUrl) {
    try {
      const messengerClient = await createMessengerClient(client, ctx)
      const profile = await messengerClient.getUserProfile(messagingEntry.sender.id, {
        fields: ['id', 'name', 'profile_pic'],
      })
      logger.forBot().debug('Fetched latest Messenger user profile:', profile)
      await client.updateUser({ id: user.id, name: profile.name, pictureUrl: profile.profilePic })
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Messenger', error)
    }
  }

  await client.getOrCreateMessage({
    tags: {
      id: mid,
      senderId: sender.id,
      recipientId: recipient.id,
    },
    type,
    payload,
    userId: user.id,
    conversationId: conversation.id,
  })
}

function _getMediaExpiry(ctx: bp.Context) {
  const expiryDelayHours = ctx.configuration.downloadedMediaExpiry || 0
  if (expiryDelayHours === 0) {
    return undefined
  }
  const expiresAt = new Date(Date.now() + expiryDelayHours * 60 * 60 * 1000)
  return expiresAt.toISOString()
}

async function _getOrDownloadMedia(
  url: string,
  client: bp.Client,
  ctx: bp.Context
): Promise<FileMetadata & { url: string }> {
  const metadata = await getMediaMetadata(url)
  if (ctx.configuration.downloadMedia) {
    return await _downloadMedia({ url, ...metadata }, client, ctx)
  }

  return { url, ...metadata }
}

async function _downloadMedia(params: { url: string } & FileMetadata, client: bp.Client, ctx: bp.Context) {
  const { url, mimeType, fileSize, fileName } = params
  const { file } = await client.upsertFile({
    key: 'messenger-media_' + (await generateIdFromUrl(url)),
    expiresAt: _getMediaExpiry(ctx),
    contentType: mimeType,
    accessPolicies: ['public_content'],
    publicContentImmediatelyAccessible: true,
    size: fileSize ?? 0,
    tags: {
      source: 'integration',
      integration: 'messenger',
      channel: 'channel',
      originUrl: url,
      ...(fileName?.length && { name: fileName }),
    },
  })

  const downloadResponse = await axios
    .get(url, {
      responseType: 'stream',
    })
    .catch((err) => {
      throw new RuntimeError(`Failed to download media: ${err.message}`)
    })

  await axios
    .put(file.uploadUrl, downloadResponse.data, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'x-amz-tagging': 'public=true',
      },
      maxBodyLength: fileSize,
    })
    .catch((err) => {
      throw new RuntimeError(`Failed to upload media: ${err.message}`)
    })

  return { url: file.url, mimeType, fileSize, fileName }
}
