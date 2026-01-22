// For outgoing messages to WeChat

import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'
import { getAccessToken, WECHAT_API_BASE } from './wechat-api'

export type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

const DEFAULT_FETCH_TIMEOUT_MS = 15000
const MAX_MEDIA_BYTES = 10 * 1024 * 1024

type WeChatTextMessage = { msgtype: 'text'; text: { content: string } }
type WeChatImageMessage = { msgtype: 'image'; image: { media_id: string } }
type WeChatVideoMessage = { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } }
type WeChatOutgoingMessage = WeChatTextMessage | WeChatImageMessage | WeChatVideoMessage

type WeChatSendResponse = { errcode?: number; errmsg?: string; msgid?: string; msg_id?: string; message_id?: string }
type SendMessageProps = {
  ctx: bp.Context
  conversation: { tags: Record<string, string> }
  ack: (props: { tags: { id: string } }) => Promise<void>
  message: WeChatOutgoingMessage
  accessToken?: string
}
// wechat require download media and upload media to WeChat, so we need to timeout the request if something goes wrong
function fetchTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId)
  })
}

function createAckId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomPart}`
}

function getAckIdFromSendResponse(response: WeChatSendResponse, fallbackPrefix: string): string {
  return response.msgid || response.msg_id || response.message_id || createAckId(fallbackPrefix)
}

// Upload media to WeChat cloud (returns media_id)
// for image and video messages
async function uploadWeChatMedia(
  accessToken: string,
  mediaUrl: string,
  mediaType: 'image' | 'voice' | 'video'
): Promise<string> {
  const mediaResponse = await fetchTimeout(mediaUrl)
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

  const formData = new FormData()
  formData.append('media', mediaBlob, `media.${fileExtension}`)

  //post the media to WeChat cloud
  const uploadUrl = `${WECHAT_API_BASE}/media/upload?access_token=${accessToken}&type=${mediaType}`
  const uploadResponse = await fetchTimeout(uploadUrl, {
    method: 'POST',
    body: formData,
  })
  if (!uploadResponse.ok) {
    throw new RuntimeError(`Failed to upload media to WeChat: ${uploadResponse.status} ${uploadResponse.statusText}`)
  }

  const uploadData = (await uploadResponse.json()) as { media_id?: string; errcode?: number; errmsg?: string }

  if (uploadData.errcode && uploadData.errcode !== 0) {
    throw new RuntimeError(`Failed to upload media to WeChat: ${uploadData.errmsg} (code: ${uploadData.errcode})`)
  }

  if (!uploadData.media_id) {
    throw new RuntimeError('Failed to upload media to WeChat: missing media_id')
  }

  return uploadData.media_id
}

// send message to WeChat user, with no 5 seconds limit
async function sendWeChatMessage(
  accessToken: string,
  toUser: string,
  message: WeChatOutgoingMessage
): Promise<WeChatSendResponse> {
  const url = `${WECHAT_API_BASE}/message/custom/send?access_token=${accessToken}`

  const response = await fetchTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: toUser,
      ...message,
    }),
  })
  if (!response.ok) {
    throw new RuntimeError(`Failed to send WeChat message: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as WeChatSendResponse

  if (data.errcode && data.errcode !== 0) {
    throw new RuntimeError(`Failed to send WeChat message: ${data.errmsg} (code: ${data.errcode})`)
  }

  return data
}

// get chat ID (WeChat user OpenID) from conversation tags
function getWeChatChatId(conversation: { tags: Record<string, string> }): string {
  const chatId = conversation.tags?.id || conversation.tags?.chatId
  if (!chatId) {
    throw new RuntimeError('Conversation does not have a WeChat chat ID')
  }
  return chatId
}

// Acknowledge message - ack is a function that takes tags
async function acknowledgeMessage(
  ack: (props: { tags: { id: string } }) => Promise<void>,
  messageId: string
): Promise<void> {
  await ack({ tags: { id: messageId } })
}

async function sendMessage({ ctx, conversation, ack, message, accessToken }: SendMessageProps): Promise<void> {
  const chatId = getWeChatChatId(conversation)
  const token = accessToken || (await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret))
  const sendResponse = await sendWeChatMessage(token, chatId, message)

  // Botpress ack expects a unique tag; fall back when API doesn't return a message id.
  const ackId = getAckIdFromSendResponse(sendResponse, 'wechat')
  await acknowledgeMessage(ack, ackId)
}

export const handleTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const { payload, ctx, conversation, ack } = props
  const { text } = payload
  await sendMessage({
    ctx,
    conversation,
    ack,
    message: {
      msgtype: 'text',
      text: { content: text },
    },
  })
}

export const handleImageMessage = async ({ payload, ctx, conversation, ack }: MessageHandlerProps<'image'>) => {
  // handle image messages with tencent cloud url
  const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)

  const mediaId = await uploadWeChatMedia(accessToken, payload.imageUrl, 'image')
  await sendMessage({
    ctx,
    conversation,
    ack,
    accessToken,
    message: {
      msgtype: 'image',
      image: { media_id: mediaId },
    },
  })
}

export const handleVideoMessage = async ({ payload, ctx, conversation, ack }: MessageHandlerProps<'video'>) => {
  // not implemented yet
  // Send video URL as text (simplified - no media upload)
  await sendMessage({
    ctx,
    conversation,
    ack,
    message: {
      msgtype: 'text',
      text: { content: `[Video] ${payload.videoUrl}` },
    },
  })
}
