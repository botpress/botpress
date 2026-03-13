import { RuntimeError } from '@botpress/sdk'
import { WeChatClient } from '../api/client'
import { downloadMediaFromURL } from '../api/helpers'
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
    await _sendMessageToWeChat(props, {
      msgtype: 'text',
      text: { content: payload.text },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to send text message: ${message}`)
  }
}

const _handleImageMessage = async (props: bp.MessageProps['channel']['image']) => {
  const { payload, logger } = props
  try {
    const wechatClient = await WeChatClient.create(props)
    const { mediaBlob, fileExtension } = await downloadMediaFromURL(payload.imageUrl, logger)
    const mediaId = await wechatClient.uploadMedia('image', mediaBlob, fileExtension)
    await _sendMessageToWeChat(
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
    await _sendMessageToWeChat(props, {
      msgtype: 'text',
      text: { content: `[Video] ${payload.videoUrl}` },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to send video message: ${message}`)
  }
}

const _sendMessageToWeChat = async (
  props: bp.AnyMessageProps,
  message: WeChatOutgoingMessage,
  wechatClient?: WeChatClient
): Promise<void> => {
  const { conversation, ack } = props
  const wechatConvoId = conversation.tags?.id
  if (!wechatConvoId) {
    throw new RuntimeError('Conversation does not have a WeChat chat ID')
  }

  wechatClient ??= await WeChatClient.create(props)
  const sendResponse = await wechatClient.sendMessage(wechatConvoId, message)

  const ackId = sendResponse.msgId ?? createAckId('wechat')
  await ack({ tags: { id: ackId } })
}

const createAckId = (prefix: string): string => {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomPart}`
}
