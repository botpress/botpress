import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { useHandleCaughtError } from '../utils'
import { getOrRefreshAccessToken } from './auth'
import { httpGetAsJsonOrBuffer } from './axios-helpers'
import { WECHAT_API_BASE } from './constants'
import { getValidMediaPropOrThrow } from './helpers'
import {
  type WeChatSendMessageResp,
  wechatSendMessageRespSchema,
  wechatUploadMediaRespSchema,
  wechatVideoUrlRespSchema,
} from './schemas'
import * as bp from '.botpress'

type WeChatMediaResponse = Promise<{ content: Buffer; contentType: string }>
type WeChatTextMessage = { msgtype: 'text'; text: { content: string } }
type WeChatImageMessage = { msgtype: 'image'; image: { media_id: string } }
type WeChatVideoMessage = { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } }
type WeChatOutgoingMessage = WeChatTextMessage | WeChatImageMessage | WeChatVideoMessage

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
    if (resp === null) {
      throw new RuntimeError('Failed to download WeChat media -> No Content')
    }

    if (resp.type === 'JSON') {
      const result = wechatVideoUrlRespSchema.safeParse(resp.data)
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
      .post(`${WECHAT_API_BASE}/media/upload?access_token=${this._accessToken}&type=${mediaType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .catch(useHandleCaughtError('Failed to upload media to WeChat API'))

    const result = wechatUploadMediaRespSchema.safeParse(resp.data)
    if (!result.success) {
      throw new RuntimeError(`Unexpected response received when uploading media to WeChat -> ${result.error.message}`)
    }
    return getValidMediaPropOrThrow('media_id', result.data, 'Failed to upload media to WeChat')
  }

  public static async create(props: bp.CommonHandlerProps) {
    const token = await getOrRefreshAccessToken(props)
    return new WeChatClient(token, props.logger)
  }
}
