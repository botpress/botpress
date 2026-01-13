import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'
const OAUTH_REDIRECT_URI = 'https://webhook.botpress.cloud/oauth'
const BOTPRESS_LINKEDIN_CLIENT_ID = '7831bmd1a7lfnj'

type OAuthCredentialsPayload = bp.states.oauthCredentials.OauthCredentials['payload']

type UserInfo = {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
  email_verified?: boolean
}

type ClientCredentials = {
  clientId: string
  clientSecret: string
}

type LinkedInTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
}

type LinkedInErrorResponse = {
  message: string
  serviceErrorCode: number
  status: number
}

export function extractLinkedInHeaders(response: Response): Record<string, string> {
  return {
    'x-li-uuid': response.headers.get('x-li-uuid') ?? 'N/A',
    'x-li-fabric': response.headers.get('x-li-fabric') ?? 'N/A',
    'x-li-request-id': response.headers.get('x-li-request-id') ?? 'N/A',
  }
}

export async function formatLinkedInError(response: Response, action: string): Promise<string> {
  const headers = extractLinkedInHeaders(response)
  const responseClone = response.clone()

  let errorMessage: string
  try {
    const errorData = (await responseClone.json()) as LinkedInErrorResponse
    errorMessage = `${errorData.message} (serviceErrorCode: ${errorData.serviceErrorCode})`
  } catch {
    errorMessage = await response.text()
  }

  return `${action}: ${errorMessage} (x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
}

export class LinkedInOAuthClient {
  private _credentials: OAuthCredentialsPayload
  private _client: bp.Client
  private _ctx: bp.Context
  private _clientId: string
  private _clientSecret: string

  private constructor({
    credentials,
    client,
    ctx,
    clientId,
    clientSecret,
  }: {
    credentials: OAuthCredentialsPayload
    client: bp.Client
    ctx: bp.Context
    clientId: string
    clientSecret: string
  }) {
    this._credentials = credentials
    this._client = client
    this._ctx = ctx
    this._clientId = clientId
    this._clientSecret = clientSecret
  }

  /**
   * Creates OAuth client using Botpress's official LinkedIn app credentials.
   * Used for automatic OAuth configuration flow.
   */
  public static async createFromAuthorizationCode({
    authorizationCode,
    client,
    ctx,
  }: {
    authorizationCode: string
    client: bp.Client
    ctx: bp.Context
  }): Promise<LinkedInOAuthClient> {
    const clientCredentials = LinkedInOAuthClient._getBotpressClientCredentials()
    return LinkedInOAuthClient._exchangeCodeForTokens({
      authorizationCode,
      clientCredentials,
      client,
      ctx,
    })
  }

  public static async createFromManualConfig({
    authorizationCode,
    clientId,
    clientSecret,
    client,
    ctx,
  }: {
    authorizationCode: string
    clientId: string
    clientSecret: string
    client: bp.Client
    ctx: bp.Context
  }): Promise<LinkedInOAuthClient> {
    return LinkedInOAuthClient._exchangeCodeForTokens({
      authorizationCode,
      clientCredentials: { clientId, clientSecret },
      client,
      ctx,
    })
  }

  public static async createFromState({
    client,
    ctx,
  }: {
    client: bp.Client
    ctx: bp.Context
  }): Promise<LinkedInOAuthClient> {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oauthCredentials',
      id: ctx.integrationId,
    })

    const clientCredentials = LinkedInOAuthClient._getClientCredentials(ctx)

    return new LinkedInOAuthClient({
      credentials: state.payload,
      client,
      ctx,
      clientId: clientCredentials.clientId,
      clientSecret: clientCredentials.clientSecret,
    })
  }

  public async getAccessToken(): Promise<string> {
    await this._refreshTokenIfNeeded()
    return this._credentials.accessToken.token
  }

  public getUserId(): string {
    return this._credentials.linkedInUserId
  }

  public getGrantedScopes(): string[] {
    return this._credentials.grantedScopes
  }

  private static async _exchangeCodeForTokens({
    authorizationCode,
    clientCredentials,
    client,
    ctx,
  }: {
    authorizationCode: string
    clientCredentials: ClientCredentials
    client: bp.Client
    ctx: bp.Context
  }): Promise<LinkedInOAuthClient> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: OAUTH_REDIRECT_URI,
      client_id: clientCredentials.clientId,
      client_secret: clientCredentials.clientSecret,
    })

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorMsg = await formatLinkedInError(response, 'Failed to exchange authorization code')
      throw new sdk.RuntimeError(errorMsg)
    }

    const tokenData = (await response.json()) as LinkedInTokenResponse

    if (!tokenData.access_token) {
      throw new sdk.RuntimeError('No access token received from LinkedIn')
    }

    const userInfo = await LinkedInOAuthClient._fetchUserInfo(tokenData.access_token)

    const now = new Date()
    const accessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

    const credentials: OAuthCredentialsPayload = {
      accessToken: {
        token: tokenData.access_token,
        issuedAt: now.toISOString(),
        expiresAt: accessTokenExpiresAt.toISOString(),
      },
      refreshToken: tokenData.refresh_token
        ? {
            token: tokenData.refresh_token,
            issuedAt: now.toISOString(),
            expiresAt: tokenData.refresh_token_expires_in
              ? new Date(now.getTime() + tokenData.refresh_token_expires_in * 1000).toISOString()
              : undefined,
          }
        : undefined,
      grantedScopes: tokenData.scope ? tokenData.scope.split(' ') : [],
      linkedInUserId: userInfo.sub,
    }

    const oauthClient = new LinkedInOAuthClient({
      credentials,
      client,
      ctx,
      clientId: clientCredentials.clientId,
      clientSecret: clientCredentials.clientSecret,
    })
    await oauthClient._saveCredentials()

    return oauthClient
  }

  private async _refreshTokenIfNeeded(): Promise<void> {
    const accessTokenExpiresAt = new Date(this._credentials.accessToken.expiresAt)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (accessTokenExpiresAt > fiveMinutesFromNow) {
      return
    }

    if (!this._credentials.refreshToken) {
      throw new sdk.RuntimeError(
        'LinkedIn access token has expired and no refresh token is available. ' +
          'Please re-authorize the integration through the OAuth flow.'
      )
    }

    if (this._credentials.refreshToken.expiresAt) {
      const refreshTokenExpiresAt = new Date(this._credentials.refreshToken.expiresAt)
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      if (refreshTokenExpiresAt <= sevenDaysFromNow) {
        throw new sdk.RuntimeError(
          'LinkedIn refresh token has expired or will expire soon. ' +
            'Please re-authorize the integration through the OAuth flow to obtain a new refresh token.'
        )
      }
    }

    await this._refreshAccessToken()
  }

  private async _refreshAccessToken(): Promise<void> {
    if (!this._credentials.refreshToken) {
      throw new sdk.RuntimeError('No refresh token available')
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this._credentials.refreshToken.token,
      client_id: this._clientId,
      client_secret: this._clientSecret,
    })

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const headers = extractLinkedInHeaders(response)
      const errorText = await response.text()

      // LinkedIn returns 400 with specific error messages when refresh token is expired/revoked/invalid
      // This requires the user to go through the full OAuth flow again to get a new refresh token
      if (errorText.includes('expired') || errorText.includes('revoked') || errorText.includes('invalid')) {
        throw new sdk.RuntimeError(
          'LinkedIn refresh token has expired, been revoked, or is invalid. ' +
            'Please re-authorize the integration through the OAuth flow to obtain a new refresh token. ' +
            `(x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
        )
      }

      throw new sdk.RuntimeError(
        `Failed to refresh LinkedIn access token: ${errorText} ` +
          `(x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
      )
    }

    const tokenData = (await response.json()) as LinkedInTokenResponse

    if (!tokenData.access_token) {
      throw new sdk.RuntimeError('No access token received from LinkedIn during refresh')
    }

    const now = new Date()
    const newAccessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

    this._credentials = {
      ...this._credentials,
      accessToken: {
        token: tokenData.access_token,
        issuedAt: now.toISOString(),
        expiresAt: newAccessTokenExpiresAt.toISOString(),
      },
      refreshToken: tokenData.refresh_token
        ? {
            token: tokenData.refresh_token,
            issuedAt: this._credentials.refreshToken?.issuedAt ?? now.toISOString(),
            expiresAt: tokenData.refresh_token_expires_in
              ? new Date(now.getTime() + tokenData.refresh_token_expires_in * 1000).toISOString()
              : this._credentials.refreshToken?.expiresAt,
          }
        : this._credentials.refreshToken,
      grantedScopes: tokenData.scope ? tokenData.scope.split(' ') : this._credentials.grantedScopes,
    }

    await this._saveCredentials()
  }

  private async _saveCredentials(): Promise<void> {
    await this._client.setState({
      type: 'integration',
      name: 'oauthCredentials',
      id: this._ctx.integrationId,
      payload: this._credentials,
    })
  }

  private static async _fetchUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorMsg = await formatLinkedInError(response, 'Failed to fetch LinkedIn user info')
      throw new sdk.RuntimeError(errorMsg)
    }

    return (await response.json()) as UserInfo
  }

  private static _getBotpressClientCredentials(): ClientCredentials {
    return {
      clientId: BOTPRESS_LINKEDIN_CLIENT_ID,
      clientSecret: bp.secrets.CLIENT_SECRET,
    }
  }

  /**
   * Resolves client credentials based on configuration type.
   * - For manual config: uses user-provided clientId/clientSecret from ctx.configuration
   * - For automatic OAuth: uses Botpress's official LinkedIn app credentials
   */
  private static _getClientCredentials(ctx: bp.Context): ClientCredentials {
    if (ctx.configurationType === 'manual') {
      return {
        clientId: ctx.configuration.clientId,
        clientSecret: ctx.configuration.clientSecret,
      }
    }
    return LinkedInOAuthClient._getBotpressClientCredentials()
  }
}
