import { WeChatClient } from '../api/client'
import { WeChatMediaMessage } from './schemas'
import * as bp from '.botpress'

type BaseMessage = {
  conversationId: string
  userId: string
  tags: {
    id: string
    chatId: string
  }
}

type MessageChannels = bp.channels.Channels['channel']['messages']
type CommonCreateMessageInput = Pick<Parameters<bp.Client['createMessage']>[0], 'type' | 'payload'>
export const createChannelMessage = async <T extends keyof MessageChannels>(
  client: bp.Client,
  baseMessage: BaseMessage,
  type: T,
  payload: MessageChannels[T]
) => {
  const input: CommonCreateMessageInput = { type, payload }
  await client.createMessage({
    ...baseMessage,
    ...input,
  })
}

export const createMediaMessage = async (
  props: bp.CommonHandlerProps,
  baseMessage: BaseMessage,
  messageId: string,
  wechatMessage: WeChatMediaMessage
) => {
  const { msgType, picUrl, mediaId } = wechatMessage
  const mediaUrl = await _getOrUploadWeChatMedia(props, {
    messageId,
    kind: msgType,
    picUrl,
    mediaId,
  })
  if (!mediaUrl) {
    props.logger.forBot().error(`Failed to create message of type: ${msgType}`)
    return
  }

  const payload = msgType === 'image' ? { imageUrl: mediaUrl } : { videoUrl: mediaUrl }
  await createChannelMessage(props.client, baseMessage, msgType, payload)
}

const _getOrUploadWeChatMedia = async (
  { client, ctx }: bp.CommonHandlerProps,
  params: {
    messageId: string
    mediaId?: string
    picUrl?: string
    kind: 'image' | 'video'
  }
) => {
  const { messageId, mediaId, picUrl, kind } = params
  const mediaKey = `wechat/media/${kind}/${mediaId || messageId || Date.now()}`

  if (picUrl) {
    const { file } = await client.uploadFile({
      key: mediaKey,
      url: picUrl,
      accessPolicies: ['public_content'],
      publicContentImmediatelyAccessible: true,
    })
    return file.url
  }

  if (mediaId) {
    const wechatClient = await WeChatClient.create(ctx.configuration.appId, ctx.configuration.appSecret)
    const { content, contentType } = await wechatClient.downloadWeChatMedia(mediaId)
    const { file } = await client.uploadFile({
      key: mediaKey,
      content,
      contentType,
      accessPolicies: ['public_content'],
      publicContentImmediatelyAccessible: true,
    })
    return file.url
  }

  return undefined
}
