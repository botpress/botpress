import { RuntimeError } from '@botpress/client'

export const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

export async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const response = await fetch(url)
  const data = (await response.json()) as { access_token?: string; errcode?: number; errmsg?: string }

  if (data.errcode) {
    throw new RuntimeError(`Failed to get WeChat access token: ${data.errmsg}`)
  }

  if (!data.access_token) {
    throw new RuntimeError('Failed to get WeChat access token: missing access_token')
  }

  return data.access_token
}
