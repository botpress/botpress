import { RuntimeError } from '@botpress/client'

// WeChat API base URL
export const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

// Get access token from WeChat API
export async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const response = await fetch(url)
  const data = (await response.json()) as { access_token?: string; errcode?: number; errmsg?: string }

  if (data.errcode) {
    throw new RuntimeError(`Failed to get WeChat access token: ${data.errmsg}`)
  }

  return data.access_token!
}

export function getMediaUrl(accessToken: string, mediaId: string): string {
  return `${WECHAT_API_BASE}/media/get?access_token=${accessToken}&media_id=${mediaId}`
}

export async function downloadWeChatMedia(
  accessToken: string,
  mediaId: string
): Promise<{ content: ArrayBuffer; contentType?: string }> {
  const mediaUrl = getMediaUrl(accessToken, mediaId)
  return await downloadWeChatMediaFromUrl(mediaUrl)
}

async function downloadWeChatMediaFromUrl(url: string): Promise<{ content: ArrayBuffer; contentType?: string }> {
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
    return await downloadWeChatMediaFromUrl(data.video_url)
  }

  const content = await response.arrayBuffer()
  return { content, contentType }
}
