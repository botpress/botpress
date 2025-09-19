import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import type { Result } from '../types'
import {
  type GetAccessTokenResp,
  docusignOAuthAccessTokenRespSchema,
  type GetUserInfoResp,
  getUserInfoRespSchema,
} from './schemas'
import { GetAccessTokenParams } from './types'
import * as bp from '.botpress'

export class DocusignAuthClient {
  private _axiosClient: AxiosInstance

  public constructor() {
    const { OAUTH_BASE_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = bp.secrets

    // Opted for axios here since the docusign package only has
    // a function for getting an accessToken from the oauth code
    // but not for refresh tokens
    this._axiosClient = axios.create({
      baseURL: OAUTH_BASE_URL,
      headers: {
        Authorization: `Basic ${Buffer.from(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`).toString('base64')}`,
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    })
  }

  private async _getAccessToken(params: GetAccessTokenParams): Promise<Result<GetAccessTokenResp>> {
    // The Docusign API Postman collection example uses FormData for this endpoint.
    const formData = new FormData()
    Object.entries(params).forEach(([key, value]) => formData.append(key, value))

    // Docusign doesn't return a timestamp when a token is issued. So a timestamp
    // is generated prior to the request being made so the expiry time is accurate.
    const tokenRequestedAt = Date.now()

    const resp = await this._axiosClient.post('/oauth/token', formData)

    if (resp.status < 200 || resp.status >= 300) {
      return {
        success: false,
        error: new RuntimeError(
          `Failed to retrieve access token w/${params.grant_type} | Invalid Status '${resp.status}'`
        ),
      }
    }

    const result = docusignOAuthAccessTokenRespSchema.safeParse(resp.data)
    if (!result.success) {
      return {
        success: false,
        error: new RuntimeError(`Failed to retrieve access token w/${params.grant_type} | Schema Parse Failure`),
      }
    }

    return {
      success: true,
      data: {
        accessToken: result.data.access_token,
        tokenType: result.data.token_type,
        expiresAt: tokenRequestedAt + result.data.expires_in * 1000,
        refreshToken: result.data.refresh_token,
      },
    }
  }

  public async getAccessTokenWithCode(code: string): Promise<Result<GetAccessTokenResp>> {
    return this._getAccessToken({
      grant_type: 'authorization_code',
      code,
    })
  }

  public async getAccessTokenWithRefreshToken(refreshToken: string): Promise<Result<GetAccessTokenResp>> {
    return this._getAccessToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  }

  public async getUserInfo(accessToken: string, tokenType: string): Promise<Result<GetUserInfoResp>> {
    const resp = await this._axiosClient.get('/oauth/userinfo', {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    })

    if (resp.status < 200 || resp.status >= 300) {
      return {
        success: false,
        error: new RuntimeError(`Failed to retrieve user info | Invalid Status '${resp.status}'`),
      }
    }

    const result = getUserInfoRespSchema.safeParse(resp.data)
    if (!result.success) {
      return {
        success: false,
        error: new RuntimeError('Failed to retrieve user info | Schema Parse Failure'),
      }
    }

    return { success: true, data: result.data }
  }
}
