import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { Result } from '../types'
import { useHandleCaughtError } from '../utils'
import { httpGetAsJsonOrBuffer } from './axios-helpers'
import { getValidMediaPropOrThrow } from './helpers'
import {
  weChatAuthTokenRespSchema,
  type WeChatSendMessageResp,
  wechatSendMessageRespSchema,
  wechatUploadMediaRespSchema,
  wechatVideoUrlRespSchema,
} from './schemas'
import * as bp from '.botpress'

export const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin'

type WeChatMediaResponse = Promise<{ content: Buffer; contentType: string }>
type WeChatTextMessage = { msgtype: 'text'; text: { content: string } }
type WeChatImageMessage = { msgtype: 'image'; image: { media_id: string } }
type WeChatVideoMessage = { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } }
type WeChatOutgoingMessage = WeChatTextMessage | WeChatImageMessage | WeChatVideoMessage

// TODO: Finish cleaning this class logic up
export class WeChatClient {
  private constructor(
    private readonly _accessToken: string,
    private readonly _logger: bp.Logger
  ) {}

  public getMediaUrl(accessToken: string, mediaId: string): string {
    return `${WECHAT_API_BASE}/media/get?access_token=${accessToken}&media_id=${mediaId}`
  }

  public async downloadWeChatMedia(mediaId: string): WeChatMediaResponse {
    const mediaUrl = this.getMediaUrl(this._accessToken, mediaId)
    return this._downloadWeChatMediaFromUrl(mediaUrl, true)
  }

  private async _downloadWeChatMediaFromUrl(url: string, retry: boolean): WeChatMediaResponse {
    if (!retry) {
      // This solution isn't ideal, I'd rather remove the recursion entirely. But this will suffice for now
      throw new RuntimeError('Failed to download media from WeChat -> Too many retries')
    }

    const resp = await httpGetAsJsonOrBuffer(url, this._logger).catch(
      useHandleCaughtError('Failed to download WeChat media')
    )

    if (resp.type === 'JSON') {
      const result = wechatVideoUrlRespSchema.safeParse(resp)
      if (!result.success) {
        throw new RuntimeError('Received unexpected response when downloading WeChat media')
      }

      const videoUrl = getValidMediaPropOrThrow('video_url', result.data, 'Failed to download media from WeChat')
      return this._downloadWeChatMediaFromUrl(videoUrl, false)
    }

    return { content: resp.buffer, contentType: resp.contentType }
  }

  public async sendMessage(toUser: string, message: WeChatOutgoingMessage): Promise<WeChatSendMessageResp> {
    const resp = await axios
      .post(`${WECHAT_API_BASE}/message/custom/send?access_token=${this._accessToken}`, {
        touser: toUser,
        ...message,
      })
      .catch(useHandleCaughtError('Failed to send WeChat message'))

    const parseResult = wechatSendMessageRespSchema.safeParse(resp.data)
    if (!parseResult.success) {
      throw new RuntimeError('Unexpected response structure received when attempting to send message to WeChat')
    }

    const data = parseResult.data
    if (data.errorCode && data.errorCode !== 0) {
      throw new RuntimeError(`Failed to send WeChat message -> (Error code: ${data.errorCode}) ${data.errorMsg}`)
    }

    return data
  }

  public async uploadMedia(mediaType: 'image' | 'voice' | 'video', mediaBlob: Blob, fileExtension: string) {
    const formData = new FormData()
    formData.append('media', mediaBlob, `media.${fileExtension}`)

    const resp = await axios
      .post(`${WECHAT_API_BASE}/media/upload?access_token=${this._accessToken}&type=${mediaType}`)
      .catch(useHandleCaughtError('Failed to upload media to WeChat API'))

    const result = wechatUploadMediaRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError(`Unexpected response received when uploading media to WeChat -> ${result.error.message}`)
    }
    return getValidMediaPropOrThrow('media_id', result.data, 'Failed to upload media to WeChat')
  }

  public static async create(ctx: bp.Context, logger: bp.Logger) {
    const { appId, appSecret } = ctx.configuration
    const tokenResult = await _getAccessToken(appId, appSecret)
    if (!tokenResult.success) throw tokenResult.error

    return new WeChatClient(tokenResult.data, logger)
  }
}

async function _getAccessToken(appId: string, appSecret: string): Promise<Result<string>> {
  const resp = await axios
    .get(`${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`)
    .catch(useHandleCaughtError('Failed to acquire a WeChat access token'))

  const result = weChatAuthTokenRespSchema.safeParse(resp.data)
  if (!result.success) {
    return {
      success: false,
      error: new RuntimeError(`Unexpected access token response received -> ${result.error.message}`),
    }
  }

  const { data } = result
  if ('errcode' in data) {
    return {
      success: false,
      error: new RuntimeError(
        `Failed to acquire a WeChat access token (Error Code: ${data.errcode}) -> ${data.errmsg}`
      ),
    }
  }

  return { success: true, data: data.access_token }
}
