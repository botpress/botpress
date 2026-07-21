import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export type OAuthTokens = {
  accessToken: string
  refreshToken?: string
  // Unix ms; absent for non-expiring tokens (OAuth clients created before 2026-04-30).
  expiresAt?: number
}

const _tokenUrl = (subdomain: string) => `https://${subdomain}.zendesk.com/oauth/tokens`

// refresh_token / expires_in are optional so non-expiring clients (pre-2026-04-30) still parse.
const _parseTokens = (data: unknown): OAuthTokens => {
  const parsed = sdk.z
    .object({
      access_token: sdk.z.string(),
      refresh_token: sdk.z.string().optional(),
      expires_in: sdk.z.number().optional(),
    })
    .parse(data)
  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresAt: parsed.expires_in ? Date.now() + parsed.expires_in * 1000 : undefined,
  }
}

export const exchangeAuthorizationCode = async (
  authorizationCode: string,
  subdomain: string,
  redirectUri: string
): Promise<OAuthTokens> => {
  const { data } = await axios.post(
    _tokenUrl(subdomain),
    {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: bp.secrets.CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read write',
      code_verifier: bp.secrets.CODE_CHALLENGE,
    },
    { headers: { 'Content-Type': 'application/json' } }
  )
  return _parseTokens(data)
}

export const refreshAccessToken = async (subdomain: string, refreshToken: string): Promise<OAuthTokens> => {
  const { data } = await axios.post(
    _tokenUrl(subdomain),
    {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      scope: 'read write',
    },
    { headers: { 'Content-Type': 'application/json' } }
  )
  return _parseTokens(data)
}
