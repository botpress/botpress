import { RuntimeError } from '@botpress/client'
import { getAccessToken, WECHAT_API_BASE } from './auth'

export class WechatClient {
  private accessToken?: string

  public constructor(
    private readonly appId: string,
    private readonly appSecret: string
  ) {}

  public async getAccessToken(): Promise<string> {
    const token = await getAccessToken(this.appId, this.appSecret)
    this.accessToken = token
    return token
  }

  public getMediaUrl(accessToken: string, mediaId: string): string {
    return `${WECHAT_API_BASE}/media/get?access_token=${accessToken}&media_id=${mediaId}`
  }

  public async downloadWeChatMedia(mediaId: string): Promise<{ content: ArrayBuffer; contentType?: string }> {
    const accessToken = this.accessToken ?? (await this.getAccessToken())
    const mediaUrl = this.getMediaUrl(accessToken, mediaId)
    return this.downloadWeChatMediaFromUrl(mediaUrl)
  }

  private async downloadWeChatMediaFromUrl(url: string): Promise<{ content: ArrayBuffer; contentType?: string }> {
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
      return this.downloadWeChatMediaFromUrl(data.video_url)
    }

    const content = await response.arrayBuffer()
    return { content, contentType }
  }
}
