import { RuntimeError, z } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

type InstagramClientConfig = { accessToken?: string; instagramId?: string }

export class InstagramClient {
  private _clientId: string
  private _clientSecret: string
  private _version: string = 'v21.0'
  private _baseGraphApiUrl = 'https://graph.instagram.com'

  public constructor(
    private _logger: bp.Logger,
    private _authConfig?: InstagramClientConfig
  ) {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }
  public async getAccessTokenFromCode(code: string): Promise<{
    accessToken: string
    expirationTime: number
  }> {
    const formData = {
      client_id: this._clientId,
      client_secret: this._clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
      code,
    }

    const queryString = new URLSearchParams(formData)
    let res = await axios.post('https://api.instagram.com/oauth/access_token', queryString.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

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

    res = await axios.get(`${this._baseGraphApiUrl}/access_token?${query.toString()}`)

    const { access_token, expires_in } = z
      .object({
        access_token: z.string(),
        expires_in: z.number(),
      })
      .parse(res.data)

    return { accessToken: access_token, expirationTime: Date.now() + expires_in * 1000 }
  }

  public async refreshAccessToken(): Promise<{ accessToken: string; expirationTime: number }> {
    const query = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: this._getAccessToken(),
    })
    const response = await axios.get(`${this._baseGraphApiUrl}/refresh_access_token?${query.toString()}`)
    const { access_token, expires_in } = z
      .object({
        access_token: z.string(),
        expires_in: z.number(),
      })
      .parse(response.data)

    return {
      accessToken: access_token,
      expirationTime: Date.now() + expires_in * 1000,
    }
  }

  public async subscribeToWebhooks(accessToken: string) {
    try {
      const response = await axios.post(`${this._baseGraphApiUrl}/me/subscribed_apps?access_token=${accessToken}`, {
        subscribed_fields: ['messages', 'messaging_postbacks'],
      })

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
    const response = await axios.get<{ id: string; name: string; username: string } & Record<string, any>>(url)

    return response.data
  }

  public updateAuthConfig(newConfig: InstagramClientConfig) {
    this._authConfig = { ...this._authConfig, ...newConfig }
  }

  private _getAccessToken() {
    if (!this._authConfig?.accessToken) {
      throw new RuntimeError('The Instagram meta client is missing the accessToken')
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

type GetCredentialsOutput = Required<InstagramClientConfig>
export async function getCredentials(client: bp.Client, ctx: bp.Context): Promise<GetCredentialsOutput> {
  let credentials: GetCredentialsOutput
  if (ctx.configurationType === 'manual') {
    credentials = {
      instagramId: ctx.configuration.instagramId,
      accessToken: ctx.configuration.accessToken,
    }
  } else if (ctx.configurationType === 'sandbox') {
    credentials = {
      instagramId: bp.secrets.SANDBOX_INSTAGRAM_ID,
      accessToken: bp.secrets.SANDBOX_ACCESS_TOKEN,
    }
  } else {
    const {
      state: {
        payload: { accessToken, instagramId },
      },
    } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId }).catch((err) => {
      throw new RuntimeError(`Could not get OAuth credentials, please reauthorize (${err})`)
    })
    credentials = {
      instagramId,
      accessToken,
    }
  }

  return credentials
}

export function getVerifyToken(ctx: bp.Context): string {
  // Should normally be verified in the fallbackHandler script with OAuth and Sandbox
  let verifyToken: string
  if (ctx.configurationType === 'manual') {
    verifyToken = ctx.configuration.verifyToken
  } else if (ctx.configurationType === 'sandbox') {
    verifyToken = bp.secrets.SANDBOX_VERIFY_TOKEN
  } else {
    verifyToken = bp.secrets.VERIFY_TOKEN
  }

  return verifyToken
}

export function getClientSecret(ctx: bp.Context): string | undefined {
  let value: string | undefined
  if (ctx.configurationType === 'manual') {
    value = ctx.configuration.clientSecret
  } else if (ctx.configurationType === 'sandbox') {
    value = bp.secrets.SANDBOX_CLIENT_SECRET
  } else {
    value = bp.secrets.CLIENT_SECRET
  }

  return value?.length ? value : undefined
}
