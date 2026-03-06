import { RuntimeError } from '@botpress/sdk'
import { WeChatClient } from '../api/client'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      text: async (props) => _handleTextMessage(props),
      image: async (props) => _handleImageMessage(props),
      video: async (props) => _handleVideoMessage(props),
    },
  },
} satisfies bp.IntegrationProps['channels']

type WeChatTextMessage = { msgtype: 'text'; text: { content: string } }
type WeChatImageMessage = { msgtype: 'image'; image: { media_id: string } }
type WeChatVideoMessage = { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } }
type WeChatOutgoingMessage = WeChatTextMessage | WeChatImageMessage | WeChatVideoMessage

const MAX_MEDIA_BYTES = 10 * 1024 * 1024

const _handleTextMessage = async (props: bp.MessageProps['channel']['text']) => {
  const { payload, logger } = props
  try {
    await _sendMessage(props, {
      msgtype: 'text',
      text: { content: payload.text },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to send text message: ${message}`)
  }
}

const _handleImageMessage = async (props: bp.MessageProps['channel']['image']) => {
  const { ctx, payload, logger } = props
  try {
    const wechatClient = await WeChatClient.create(ctx)
    const mediaId = await _uploadWeChatMedia(wechatClient, payload.imageUrl, 'image')
    await _sendMessage(
      props,
      {
        msgtype: 'image',
        image: { media_id: mediaId },
      },
      wechatClient
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to send image message: ${message}`)
  }
}

const _handleVideoMessage = async (props: bp.MessageProps['channel']['video']) => {
  const { payload, logger } = props
  try {
    await _sendMessage(props, {
      msgtype: 'text',
      text: { content: `[Video] ${payload.videoUrl}` },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to send video message: ${message}`)
  }
}

const _sendMessage = async (
  { conversation, ctx, ack }: bp.AnyMessageProps,
  message: WeChatOutgoingMessage,
  wechatClient?: WeChatClient
): Promise<void> => {
  const chatId = _getWeChatChatId(conversation)

  wechatClient ??= await WeChatClient.create(ctx)
  const sendResponse = await wechatClient.sendMessage(chatId, message)

  const ackId = sendResponse.msgId ?? createAckId('wechat')
  await ack({ tags: { id: ackId } })
}

// get chat ID (WeChat user OpenID) from conversation tags
const _getWeChatChatId = (conversation: { tags: Record<string, string> }): string => {
  const chatId = conversation.tags?.id || conversation.tags?.chatId
  if (!chatId) {
    throw new RuntimeError('Conversation does not have a WeChat chat ID')
  }
  return chatId
}

// Upload media to WeChat cloud (returns media_id)
// for image and video messages
const _uploadWeChatMedia = async (
  wechatClient: WeChatClient,
  mediaUrl: string,
  mediaType: 'image' | 'voice' | 'video'
): Promise<string> => {
  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) {
    throw new RuntimeError(
      `Failed to download media from URL: ${mediaUrl} (${mediaResponse.status} ${mediaResponse.statusText})`
    )
  }

  const contentLengthHeader = mediaResponse.headers.get('content-length')
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN

  if (Number.isFinite(contentLength) && contentLength > 0) {
    if (contentLength > MAX_MEDIA_BYTES) {
      throw new RuntimeError(`Media exceeds max size of ${MAX_MEDIA_BYTES} bytes`)
    }
  }

  const mediaBuffer = await mediaResponse.arrayBuffer()
  const contentTypeHeader = mediaResponse.headers.get('content-type')
  const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader : ''
  const mediaBlob = new Blob([mediaBuffer], contentType ? { type: contentType } : undefined)

  // fix media type to file extension otherwise wechat will not accept the media
  const extensionByContentType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  }

  const baseContentType = (contentType.split(';')[0] || '').trim()
  const fileExtension = extensionByContentType[baseContentType] || 'jpg'

  return await wechatClient.uploadMedia(mediaType, mediaBlob, fileExtension)
}

const createAckId = (prefix: string): string => {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomPart}`
}
