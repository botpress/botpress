import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import { getGlobalWebhookUrl } from '../index'
import * as bp from '.botpress'
import qs from 'qs'

type InstagramClientConfig = { accessToken?: string; instagramId?: string }

export class MetaClient {
  private _clientId: string
  private _clientSecret: string
  private _version: string = 'v21.0'
  private _baseGraphApiUrl = 'https://graph.instagram.com'

  public constructor(private _logger: bp.Logger, private _authConfig?: InstagramClientConfig) {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async getAccessTokenFromCode(code: string) {
    const formData = {
      client_id: this._clientId,
      client_secret: this._clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: getGlobalWebhookUrl(),
      code,
    }

    console.log('Getting short lived token with: ', { formData })

    let res = await axios.post('https://api.instagram.com/oauth/access_token', qs.stringify(formData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    console.log('Short lived request', { res })

    const shortLivedTokenData = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    const query = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this._clientSecret,
      access_token: shortLivedTokenData.access_token,
    })

    console.log('Will ask long with data: ', {
      query,
      url: `${this._baseGraphApiUrl}/access_token?${query.toString()}`,
    })

    res = await axios.get(`${this._baseGraphApiUrl}/access_token?${query.toString()}`)

    console.log('Long lived request', { res })

    const longLivedTokenData = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    console.log('returning long lived access token:', { long: longLivedTokenData.access_token })

    return longLivedTokenData.access_token
  }

  public async subscribeToWebhooks(accessToken: string) {
    try {
      const response = await axios.post(`${this._baseGraphApiUrl}/me/subscribed_apps?access_token=${accessToken}`, {
        subscribed_fields: ['messages', 'messaging_postbacks'],
      })

      console.log('Subscribe response', { response })

      if (!response?.data?.success) {
        throw new RuntimeError('No Success subscribing')
      }
    } catch (e: any) {
      this._logger
        .forBot()
        .error(`(OAuth registration) Error subscribing to webhooks: ${e.message} -> ${e?.response?.data}`)
      throw new RuntimeError('Issue subscribing to Webhooks for Page, please try again.')
    }
  }

  public async getUserProfile(instagramId: string, additionalFields: string[] = []) {
    const query = new URLSearchParams({
      access_token: this._getAccessToken(),
      fields: ['id', 'name', 'username', ...additionalFields].join(),
    })

    const url = `${this._baseGraphApiUrl}/${this._version}/${instagramId}?${query.toString()}`

    console.log('querying user v2', { url, query })

    const response = await axios.get<{ id: string; name: string; username: string } & Record<string, any>>(url)

    console.log('Response to getUserProfile', response)

    return response.data
  }

  public setAuthConfig(newConfig: InstagramClientConfig) {
    this._authConfig = { ...this._authConfig, ...newConfig }
  }

  private _getAccessToken() {
    if (!this._authConfig?.accessToken) {
      throw new RuntimeError('The Instagram meta client is messing the accessToken')
    }

    return this._authConfig.accessToken
  }

  private _getInstagramId() {
    if (!this._authConfig?.instagramId) {
      throw new RuntimeError('The Instagram meta client is messing the instagramId')
    }

    return this._authConfig.instagramId
  }

  public async sendMessage(toInstagramId: string, message: any) {
    const url = `${this._baseGraphApiUrl}/${this._version}/${this._getInstagramId()}/messages`

    const response = await axios.post<{ recipient_id: string; message_id: string }>(
      url,
      {
        recipient: {
          id: toInstagramId,
        },
        message,
      },
      {
        headers: {
          Authorization: 'Bearer ' + this._getAccessToken(),
        },
      }
    )

    return response.data
  }

  public async sendTextMessage(toInstagramId: string, text: string) {
    return this.sendMessage(toInstagramId, {
      text,
    })
  }

  public async sendImageMessage(toInstagramId: string, imageUrl: string) {
    return this.sendMessage(toInstagramId, {
      attachment: {
        type: 'image',
        payload: {
          url: imageUrl,
        },
      },
    })
  }

  public async sendAudioMessage(toInstagramId: string, audioUrl: string) {
    return this.sendMessage(toInstagramId, {
      attachment: {
        type: 'audio',
        payload: {
          url: audioUrl,
        },
      },
    })
  }

  public async sendVideoMessage(toInstagramId: string, videoUrl: string) {
    return this.sendMessage(toInstagramId, {
      attachment: {
        type: 'video',
        payload: {
          url: videoUrl,
        },
      },
    })
  }

  public async sendFileMessage(toInstagramId: string, fileUrl: string) {
    return this.sendMessage(toInstagramId, {
      attachment: {
        type: 'file',
        payload: {
          url: fileUrl,
        },
      },
    })
  }
}

export async function getCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<{ instagramId?: string; accessToken: string; clientSecret: string; clientId: string }> {
  if (ctx.configuration.useManualConfiguration) {
    return {
      instagramId: ctx.configuration.instagramId || '',
      accessToken: ctx.configuration.accessToken || '',
      clientSecret: ctx.configuration.clientSecret || '',
      clientId: ctx.configuration.clientId || '',
    }
  }

  // Otherwise use the page token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  if (!state.payload.accessToken) {
    throw new RuntimeError('There is no access token, please reauthorize')
  }

  return {
    instagramId: state.payload.instagramId,
    accessToken: state.payload.accessToken,
    clientSecret: bp.secrets.CLIENT_SECRET,
    clientId: bp.secrets.CLIENT_ID,
  }
}
