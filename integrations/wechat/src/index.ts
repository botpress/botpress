import { handleImageMessage, handleTextMessage, handleVideoMessage } from './misc/message-handlers'
import { downloadWeChatMedia, getAccessToken } from './misc/wechat-api'
import { handleWechatSignatureVerificaation } from './wechat-handler'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx }: bp.HandlerProps) => {
  // Extract signature params for verification (query/path/headers)
  let signature: string | undefined
  let timestamp: string | undefined
  let nonce: string | undefined
  let echostr: string | undefined

  if (req.query) {
    const query = typeof req.query === 'string' ? new URLSearchParams(req.query) : null
    if (query) {
      signature = query.get('signature') || undefined
      timestamp = query.get('timestamp') || undefined
      nonce = query.get('nonce') || undefined
      echostr = query.get('echostr') || undefined
    }
  }

  // Get signature params from the request path
  if (!signature && req.path && req.path.includes('?')) {
    const url = new URL(req.path, 'http://localhost')
    signature = url.searchParams.get('signature') || undefined
    timestamp = url.searchParams.get('timestamp') || undefined
    nonce = url.searchParams.get('nonce') || undefined
    echostr = url.searchParams.get('echostr') || undefined
  }

  // Get signature params from the headers
  if (!signature && req.headers) {
    signature = req.headers['x-wechat-signature'] || undefined
    timestamp = req.headers['x-wechat-timestamp'] || undefined
    nonce = req.headers['x-wechat-nonce'] || undefined
  }

  // Handle WeChat signature verification
  const method = (req.method ?? 'POST').toUpperCase()
  const result = handleWechatSignatureVerificaation({
    wechatToken: ctx.configuration.wechatToken,
    method,
    signature,
    timestamp,
    nonce,
    echostr,
    body: req.body,
  })

  if (req.method === 'GET' && echostr) {
    //  this is where the issue exist and we add a "|" to resolve the problem and in the proxy, it will be removed
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: echostr + '|',
    }
  }

  //  Parse the message and create the conversation and user on botpress
  if (result.message) {
    const wechatMessage = result.message
    const wechatConversationId = wechatMessage.FromUserName
    const wechatUserId = wechatMessage.FromUserName
    const messageId = wechatMessage.MsgId || wechatMessage.CreateTime

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: wechatConversationId,
        fromUserId: wechatUserId,
        chatId: wechatConversationId,
      },
      discriminateByTags: ['id'],
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        id: wechatUserId,
      },
      discriminateByTags: ['id'],
    })

    const messageTags = {
      id: messageId || '',
      chatId: wechatConversationId,
    }
    const baseMessage = {
      tags: messageTags,
      userId: user.id,
      conversationId: conversation.id,
    }

    const createMessage = async (type: 'text', payload: bp.MessageProps['channel']['text']['payload']) =>
      client.createMessage({
        ...baseMessage,
        type,
        payload,
      })
    const createImageMessage = async (payload: bp.MessageProps['channel']['image']['payload']) =>
      client.createMessage({
        ...baseMessage,
        type: 'image',
        payload,
      })
    const createVideoMessage = async (payload: bp.MessageProps['channel']['video']['payload']) =>
      client.createMessage({
        ...baseMessage,
        type: 'video',
        payload,
      })

    const getOrUploadWechatMedia = async (params: {
      // upload the media to the botpress file cloud
      mediaId?: string
      picUrl?: string
      kind: 'image' | 'video'
    }): Promise<string | undefined> => {
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
        const accessToken = await getAccessToken(ctx.configuration.appId, ctx.configuration.appSecret)
        const { content, contentType } = await downloadWeChatMedia(accessToken, mediaId)
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

    switch (wechatMessage.MsgType) {
      case 'text':
        if (wechatMessage.Content) {
          await createMessage('text', { text: wechatMessage.Content })
        }
        break
      case 'image': {
        const imageUrl = await getOrUploadWechatMedia({
          kind: 'image',
          picUrl: wechatMessage.PicUrl,
          mediaId: wechatMessage.MediaId,
        })
        if (imageUrl) {
          await createImageMessage({ imageUrl })
        }
        break
      }
      case 'video': {
        const videoUrl = await getOrUploadWechatMedia({ kind: 'video', mediaId: wechatMessage.MediaId })
        if (videoUrl) {
          await createVideoMessage({ videoUrl })
        }
        break
      }
      case 'voice': // saved into the botpress file cloud
        if (wechatMessage.MediaId) {
          await createMessage('text', {
            text: `[Voice Message] MediaId: ${wechatMessage.MediaId}${
              wechatMessage.Recognition ? `\nRecognized: ${wechatMessage.Recognition}` : ''
            }`,
          })
        }
        break
      case 'location':
        await createMessage('text', {
          text: `[Location] ${wechatMessage.Label || 'location'}\nCoordinates: (${wechatMessage.Location_X || '0'}, ${wechatMessage.Location_Y || '0'})`,
        })
        break
      case 'link':
        await createMessage('text', {
          text: `[Link] ${wechatMessage.Title || 'Untitled'}\n${wechatMessage.Description || ''}\nURL: ${
            wechatMessage.Url || ''
          }`,
        })
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

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        //messages to be handled
        text: handleTextMessage,
        image: handleImageMessage,
        video: handleVideoMessage,
      },
    },
  },
  handler,
})

export default integration
