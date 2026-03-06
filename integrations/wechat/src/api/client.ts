import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { Result } from '../types'
import { useHandleCaughtError } from '../utils'
import { weChatAuthTokenResponseSchema, WeChatSendMessageResponse, wechatSendMessageResponseSchema } from './schemas'
import * as bp from '.botpress'

export const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

type WeChatMediaResponse = Promise<{ content: ArrayBuffer; contentType?: string }>
type WeChatTextMessage = { msgtype: 'text'; text: { content: string } }
type WeChatImageMessage = { msgtype: 'image'; image: { media_id: string } }
type WeChatVideoMessage = { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } }
type WeChatOutgoingMessage = WeChatTextMessage | WeChatImageMessage | WeChatVideoMessage

// TODO: Finish cleaning this class logic up
export class WeChatClient {
  private constructor(private readonly _accessToken: string) {}

  public getMediaUrl(accessToken: string, mediaId: string): string {
    return `${WECHAT_API_BASE}/media/get?access_token=${accessToken}&media_id=${mediaId}`
  }

  public async downloadWeChatMedia(mediaId: string): WeChatMediaResponse {
    const mediaUrl = this.getMediaUrl(this._accessToken, mediaId)
    return this._downloadWeChatMediaFromUrl(mediaUrl)
  }

  private async _downloadWeChatMediaFromUrl(url: string): WeChatMediaResponse {
    const response = await fetch(url)
    if (!response.ok) {
      throw new RuntimeError(`Failed to download WeChat media: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? undefined
    if (contentType?.includes('application/json')) {
      const data = (await response.json()) as { video_url?: string; errcode?: number; errmsg?: string }
      if (data.errcode) {
        throw new RuntimeError(`Failed to download WeChat media: ${data.errmsg}`)
      }
      if (!data.video_url) {
        throw new RuntimeError('Failed to download WeChat media: missing video_url')
      }
      // THIS IS VERY SKETCHY! We should NOT be using recursion here
      return this._downloadWeChatMediaFromUrl(data.video_url)
    }

    const content = await response.arrayBuffer()
    return { content, contentType }
  }

  public async sendMessage(toUser: string, message: WeChatOutgoingMessage): Promise<WeChatSendMessageResponse> {
    const resp = await axios
      .post(`${WECHAT_API_BASE}/message/custom/send?access_token=${this._accessToken}`, {
        touser: toUser,
        ...message,
      })
      .catch(useHandleCaughtError('Failed to send WeChat message'))

    const parseResult = wechatSendMessageResponseSchema.safeParse(resp.data)
    if (!parseResult.success) {
      throw new RuntimeError('Unexpected response structure received when attempting to send message to WeChat')
    }

    const data = parseResult.data
    if (data.errorCode && data.errorCode !== 0) {
      throw new RuntimeError(`Failed to send WeChat message: ${data.errorMsg} (code: ${data.errorCode})`)
    }

    return data
  }

  public async uploadMedia(mediaType: 'image' | 'voice' | 'video', mediaBlob: Blob, fileExtension: string) {
    const formData = new FormData()
    formData.append('media', mediaBlob, `media.${fileExtension}`)

    const uploadUrl = `${WECHAT_API_BASE}/media/upload?access_token=${this._accessToken}&type=${mediaType}`
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!uploadResponse.ok) {
      throw new RuntimeError(`Failed to upload media to WeChat: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    // TODO: Refactor this
    const uploadData = (await uploadResponse.json()) as { media_id?: string; errcode?: number; errmsg?: string }

    if (uploadData.errcode && uploadData.errcode !== 0) {
      throw new RuntimeError(`Failed to upload media to WeChat: ${uploadData.errmsg} (code: ${uploadData.errcode})`)
    }

    if (!uploadData.media_id) {
      throw new RuntimeError('Failed to upload media to WeChat: missing media_id')
    }

    return uploadData.media_id
  }

  public static async create(ctx: bp.Context) {
    const { appId, appSecret } = ctx.configuration
    const tokenResult = await _getAccessToken(appId, appSecret)
    if (!tokenResult.success) throw tokenResult.error

    return new WeChatClient(tokenResult.data)
  }
}

async function _getAccessToken(appId: string, appSecret: string): Promise<Result<string>> {
  const resp = await axios
    .get(`${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`)
    .catch(useHandleCaughtError('Failed to acquire a WeChat access token'))

  const result = weChatAuthTokenResponseSchema.safeParse(resp.data)
  if (!result.success) {
    return {
      success: false,
      error: new RuntimeError(`Unexpected access token response received -> ${result.error.message}`),
    }
  }

  const { data } = result
  if ('errcode' in data) {
    return { success: false, error: new RuntimeError(`Failed to acquire a WeChat access token -> ${data.errmsg}`) }
  }

  return { success: true, data: data.access_token }
}
