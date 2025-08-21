import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import type { CommonHandlerProps, Result } from '../types'
import { type CalendlyUri, type GetOAuthAccessTokenResp, getOAuthAccessTokenRespSchema, uuidSchema } from './schemas'
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

    const result = getOAuthAccessTokenRespSchema.safeParse(resp.data)
    if (!result.success) {
      return {
        success: false,
        error: new RuntimeError(`Failed to retrieve access token w/${params.grant_type} | Schema Parse Failure`),
      }
    }

    return { success: true, data: getOAuthAccessTokenRespSchema.parse(resp.data) }
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

const _extractUserUuid = (userUri: CalendlyUri): string => {
  const match = userUri.match(/\/users\/(.+)$/)

  if (!match) {
    throw new Error('Failed to extract user UUID from URI')
  }

  const parsed = uuidSchema.safeParse(match[1])
  if (!parsed.success) {
    throw new Error('Failed to extract user UUID from URI')
  }

  return parsed.data
}

export const applyOAuthState = async ({ client, ctx }: CommonHandlerProps, resp: GetOAuthAccessTokenResp) => {
  const { state } = await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      oauth: {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
        expiresAt: resp.expiresAt.getTime(),
      },
    },
  })

  if (!state.payload.oauth) {
    throw new Error('Failed to store OAuth state')
  }

  return { oauth: state.payload.oauth, userUri: resp.userUri }
}

export const exchangeAuthCodeForRefreshToken = async (props: bp.HandlerProps): Promise<void> => {
  const oAuthCode = new URLSearchParams(props.req.query).get('code')
  if (oAuthCode === null) throw new Error('Missing OAuth code')

  const authClient = new CalendlyAuthClient()
  const resp = await authClient.getAccessTokenWithCode(oAuthCode)
  if (!resp.success) throw resp.error

  const { userUri } = await applyOAuthState(props, resp.data)

  const userId = _extractUserUuid(userUri)
  await props.client.configureIntegration({
    identifier: userId,
  })
}
