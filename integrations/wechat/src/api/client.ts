import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { Result } from '../types'
import { useHandleCaughtError } from '../utils'
import { weChatAuthTokenResponseSchema } from './schemas'
import * as bp from '.botpress'

export const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

// TODO: Finish cleaning this class logic up
export class WeChatClient {
  private constructor(private readonly _accessToken: string) {}

  public getMediaUrl(accessToken: string, mediaId: string): string {
    return `${WECHAT_API_BASE}/media/get?access_token=${accessToken}&media_id=${mediaId}`
  }

  public async downloadWeChatMedia(mediaId: string): Promise<{ content: ArrayBuffer; contentType?: string }> {
    const mediaUrl = this.getMediaUrl(this._accessToken, mediaId)
    return this._downloadWeChatMediaFromUrl(mediaUrl)
  }

  private async _downloadWeChatMediaFromUrl(url: string): Promise<{ content: ArrayBuffer; contentType?: string }> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new RuntimeError(`Failed to download WeChat media: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || undefined
    if (contentType?.includes('application/json')) {
      const data = (await response.json()) as { video_url?: string; errcode?: number; errmsg?: string }
      if (data.errcode) {
        throw new RuntimeError(`Failed to download WeChat media: ${data.errmsg}`)
      }
      if (!data.video_url) {
        throw new RuntimeError('Failed to download WeChat media: missing video_url')
      }
      return this._downloadWeChatMediaFromUrl(data.video_url)
    }

    const content = await response.arrayBuffer()
    return { content, contentType }
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
