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

  /**
   * Load existing OAuth client from stored state.
   * Resolves client credentials from ctx.configuration (manual) or Botpress secrets (automatic).
   */
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
      const errorText = await response.text()
      throw new sdk.RuntimeError(`Failed to exchange authorization code: ${errorText}`)
    }

    const tokenData = (await response.json()) as {
      access_token: string
      expires_in: number
      refresh_token?: string
      refresh_token_expires_in?: number
      scope?: string
    }

    if (!tokenData.access_token) {
      throw new sdk.RuntimeError('No access token received from LinkedIn')
    }

    const userInfo = await LinkedInOAuthClient._fetchUserInfo(tokenData.access_token)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

    const credentials: OAuthCredentialsPayload = {
      accessToken: {
        token: tokenData.access_token,
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      refreshToken: tokenData.refresh_token
        ? {
            token: tokenData.refresh_token,
            issuedAt: now.toISOString(),
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
    const expiresAt = new Date(this._credentials.accessToken.expiresAt)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt > fiveMinutesFromNow) {
      return
    }

    if (!this._credentials.refreshToken) {
      throw new sdk.RuntimeError(
        'LinkedIn access token has expired and no refresh token is available. ' +
          'Please re-authorize the integration. ' +
          '(Note: Refresh tokens are only available for Marketing Developer Platform partners.)'
      )
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
      const errorText = await response.text()

      // Check for specific error cases
      if (errorText.includes('expired') || errorText.includes('revoked') || errorText.includes('invalid')) {
        throw new sdk.RuntimeError(
          'LinkedIn refresh token has expired or been revoked. Please re-authorize the integration.'
        )
      }

      throw new sdk.RuntimeError(`Failed to refresh LinkedIn access token: ${errorText}`)
    }

    const tokenData = (await response.json()) as {
      access_token: string
      expires_in: number
      refresh_token?: string
      refresh_token_expires_in?: number
      scope?: string
    }

    if (!tokenData.access_token) {
      throw new sdk.RuntimeError('No access token received from LinkedIn during refresh')
    }

    const now = new Date()
    const newExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000)

    this._credentials = {
      ...this._credentials,
      accessToken: {
        token: tokenData.access_token,
        issuedAt: now.toISOString(),
        expiresAt: newExpiresAt.toISOString(),
      },
      refreshToken: tokenData.refresh_token
        ? {
            token: tokenData.refresh_token,
            issuedAt: this._credentials.refreshToken?.issuedAt ?? now.toISOString(),
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
      const errorText = await response.text()
      throw new sdk.RuntimeError(`Failed to fetch LinkedIn user info: ${errorText}`)
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
