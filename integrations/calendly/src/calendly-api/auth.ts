import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import { Result } from '../types'
import { type GetOAuthAccessTokenResp, getOAuthAccessTokenRespSchema } from './schemas'
import * as bp from '.botpress'

const AUTH_BASE_URL = 'https://auth.calendly.com' as const

export class CalendlyAuthClient {
  private _axiosClient: AxiosInstance

  public constructor() {
    const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = bp.secrets

    this._axiosClient = axios.create({
      baseURL: AUTH_BASE_URL,
      headers: {
        Authorization: `Basic ${Buffer.from(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`).toString('base64')}`,
      },
    })
  }

  private async _getAccessToken(params: GetAccessTokenParams): Promise<Result<GetOAuthAccessTokenResp>> {
    // The Calendly API docs states that it only accepts
    // `application/x-www-form-urlencoded` for this endpoint.
    const formData = new FormData()
    Object.entries(params).forEach(([key, value]) => formData.append(key, value))
    const resp = await this._axiosClient.post('/oauth/token', formData)

    if (resp.status < 200 || resp.status >= 300) {
      return {
        success: false,
        error: new RuntimeError(
          `Failed to retrieve access token w/${params.grant_type} | Invalid Status '${resp.status}'`
        ),
      }
    }

    try {
      return { success: true, data: getOAuthAccessTokenRespSchema.parse(resp.data) }
    } catch {
      return {
        success: false,
        error: new RuntimeError(`Failed to retrieve access token w/${params.grant_type} | Schema Parse Failure`),
      }
    }
  }

  public async getAccessTokenWithCode(code: string): Promise<Result<GetOAuthAccessTokenResp>> {
    return this._getAccessToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
    })
  }

  public async getAccessTokenWithRefreshToken(refreshToken: string): Promise<Result<GetOAuthAccessTokenResp>> {
    return this._getAccessToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  }
}

type GetAccessTokenParams =
  | {
      grant_type: 'authorization_code'
      code: string
      redirect_uri: string
    }
  | {
      grant_type: 'refresh_token'
      refresh_token: string
    }
