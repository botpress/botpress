import { WechatClient } from '../misc/wechat-client'
import { handleWechatSignatureVerification } from '../wechat-handler'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  // Extract signature params for verification (query/path/headers)
  let signature: string | undefined
  let timestamp: string | undefined
  let nonce: string | undefined
  let echostr: string | undefined

  if (req.query) {
    const query = new URLSearchParams(req.query)
    signature = query.get('signature') || undefined
    timestamp = query.get('timestamp') || undefined
    nonce = query.get('nonce') || undefined
    echostr = query.get('echostr') || undefined
  }

  // Handle WeChat signature verification
  const method = req.method
  const result = handleWechatSignatureVerification({
    wechatToken: ctx.configuration.wechatToken,
    method,
    signature,
    timestamp,
    nonce,
    echostr,
    body: req.body,
  })

  if (req.method === 'GET') {
    if (!result.isValid) {
      return createTextResponse(403, 'Invalid signature')
    }

    const body = echostr ? echostr + '|' : ''
    return createTextResponse(200, body)
  }

  if (!result.isValid) {
    return createTextResponse(403, '')
  }

  //  Parse the message and create the conversation and user on botpress
  if (result.message) {
    const wechatMessage = result.message
    const wechatConversationId = wechatMessage.FromUserName
    const wechatUserId = wechatMessage.FromUserName
    const messageId = wechatMessage.MsgId || wechatMessage.CreateTime

    let conversation: Awaited<ReturnType<typeof client.getOrCreateConversation>>['conversation']
    let user: Awaited<ReturnType<typeof client.getOrCreateUser>>['user']

    try {
      ;({ conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          id: wechatConversationId,
          fromUserId: wechatUserId,
          chatId: wechatConversationId,
        },
        discriminateByTags: ['id'],
      }))
      ;({ user } = await client.getOrCreateUser({
        tags: {
          id: wechatUserId,
        },
        discriminateByTags: ['id'],
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to create user or conversation: ${message}`)
      return createTextResponse(500, 'Failed to create user or conversation')
    }

    const messageTags = {
      id: messageId || '',
      chatId: wechatConversationId,
    }
    const baseMessage = {
      tags: messageTags,
      userId: user.id,
      conversationId: conversation.id,
    }

    const wechatClient = new WechatClient(ctx.configuration.appId, ctx.configuration.appSecret)
    const createMessage = makeCreateMessage(client, baseMessage)
    const createImageMessage = makeCreateImageMessage(client, baseMessage)
    const createVideoMessage = makeCreateVideoMessage(client, baseMessage)
    const getOrUploadWechatMedia = makeGetOrUploadWechatMedia(client, wechatClient, messageId)

    switch (wechatMessage.MsgType) {
      case 'text':
        try {
          if (wechatMessage.Content) {
            await createMessage('text', { text: wechatMessage.Content })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process text message: ${message}`)
        }
        break
      case 'image': {
        try {
          const imageUrl = await getOrUploadWechatMedia({
            kind: 'image',
            picUrl: wechatMessage.PicUrl,
            mediaId: wechatMessage.MediaId,
          })
          if (imageUrl) {
            await createImageMessage({ imageUrl })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process image message: ${message}`)
        }
        break
      }
      case 'video': {
        try {
          const videoUrl = await getOrUploadWechatMedia({ kind: 'video', mediaId: wechatMessage.MediaId })
          if (videoUrl) {
            await createVideoMessage({ videoUrl })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process video message: ${message}`)
        }
        break
      }
      case 'voice':
        try {
          if (wechatMessage.MediaId) {
            await createMessage('text', {
              text: `[Voice Message] MediaId: ${wechatMessage.MediaId}${wechatMessage.Recognition ? `\nRecognized: ${wechatMessage.Recognition}` : ''}`,
            })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process voice message: ${message}`)
        }
        break
      case 'location':
        try {
          await createMessage('text', {
            text: `[Location] ${wechatMessage.Label || 'location'}\nCoordinates: (${wechatMessage.Location_X || '0'}, ${wechatMessage.Location_Y || '0'})`,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process location message: ${message}`)
        }
        break
      case 'link':
        try {
          await createMessage('text', {
            text: `[Link] ${wechatMessage.Title || 'Untitled'}\n${wechatMessage.Description || ''}\nURL: ${wechatMessage.Url || ''}`,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to process link message: ${message}`)
        }
        break
    }
  }

  // Return success response for POST requests
  return {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
    body: 'success',
  }
}

const createTextResponse = (status: number, body: string) => ({
  status,
  headers: {
    'Content-Type': 'text/plain',
  },
  body,
})

type BaseMessage = {
  tags: {
    id: string
    chatId: string
  }
  userId: string
  conversationId: string
}

const makeCreateMessage =
  (client: bp.HandlerProps['client'], baseMessage: BaseMessage) =>
  async (type: 'text', payload: bp.MessageProps['channel']['text']['payload']) =>
    client.createMessage({
      ...baseMessage,
      type,
      payload,
    })

const makeCreateImageMessage =
  (client: bp.HandlerProps['client'], baseMessage: BaseMessage) =>
  async (payload: bp.MessageProps['channel']['image']['payload']) =>
    client.createMessage({
      ...baseMessage,
      type: 'image',
      payload,
    })

const makeCreateVideoMessage =
  (client: bp.HandlerProps['client'], baseMessage: BaseMessage) =>
  async (payload: bp.MessageProps['channel']['video']['payload']) =>
    client.createMessage({
      ...baseMessage,
      type: 'video',
      payload,
    })

const makeGetOrUploadWechatMedia =
  (client: bp.HandlerProps['client'], wechatClient: WechatClient, messageId?: string) =>
  async (params: { mediaId?: string; picUrl?: string; kind: 'image' | 'video' }): Promise<string | undefined> => {
    const { mediaId, picUrl, kind } = params
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
