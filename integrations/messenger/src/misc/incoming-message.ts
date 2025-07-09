import { MessengerMessage } from './types'
import { FileMetadata, generateIdFromUrl, getMediaMetadata, getMessengerClient } from './utils'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { ValueOf } from '@botpress/sdk/dist/utils/type-utils'

type IntegrationLogger = bp.Logger

type IncomingMessages = {
  [TMessage in keyof bp.channels.channel.Messages]: {
    type: TMessage
    payload: bp.channels.channel.Messages[TMessage]
  }
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

export async function handleMessage(
  message: MessengerMessage,
  { client, ctx, logger }: { client: bp.Client; ctx: bp.Context; logger: IntegrationLogger }
) {
  const { sender, recipient, message: textMessage, postback } = message

  let text: string
  let messageId: string

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

  const createMessage = async ({ type, payload }: ValueOf<IncomingMessages>) => {
    logger.forBot().debug(`Received ${type} message from Messenger:`, payload)
    return client.createMessage({
      tags: {
        id: messageId,
        senderId: message.sender.id,
        recipientId: message.recipient.id,
      },
      type,
      payload,
      userId: user.id,
      conversationId: conversation.id,
    })
  }

  messageId = textMessage?.mid || ''

  if (textMessage?.attachments?.length) {
    for (const attachment of textMessage.attachments) {
      if (attachment.type === 'image') {
        const { url: imageUrl } = await _getOrDownloadMedia(attachment.payload.url, client, ctx)
        await createMessage({
          type: 'image',
          payload: { imageUrl },
        })
      } else if (attachment.type == 'audio') {
        const { url: audioUrl } = await _getOrDownloadMedia(attachment.payload.url, client, ctx)
        await createMessage({
          type: 'audio',
          payload: { audioUrl },
        })
      } else if (attachment.type == 'video') {
        const { url: videoUrl } = await _getOrDownloadMedia(attachment.payload.url, client, ctx)
        await createMessage({
          type: 'video',
          payload: { videoUrl },
        })
      } else if (attachment.type == 'file') {
        const { url: fileUrl, fileName } = await _getOrDownloadMedia(attachment.payload.url, client, ctx)
        await createMessage({
          type: 'file',
          payload: { fileUrl, title: fileName },
        })
      }
    }
  }

  if (textMessage?.text) {
    text = textMessage.text
    logger.forBot().debug(`Received text message from Messenger: ${textMessage.text}`)
  } else if (postback?.payload) {
    text = postback.payload
    messageId = postback.mid
    logger.forBot().debug(`Received postback from Messenger: ${postback.title}`)
  } else {
    return
  }

  if (!user.name || !user.pictureUrl) {
    try {
      const messengerClient = await getMessengerClient(client, ctx)
      const profile = await messengerClient.getUserProfile(message.sender.id, { fields: ['id', 'name', 'profile_pic'] })
      logger.forBot().debug('Fetched latest Messenger user profile: ', profile)

      await client.updateUser({ id: user.id, name: profile.name, pictureUrl: profile.profilePic })
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Messenger:', error)
    }
  }

  await createMessage({ type: 'text', payload: { text } })
}
