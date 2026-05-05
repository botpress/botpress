import * as sdk from '@botpress/sdk'
import { linkedInErrorResponseSchema, linkedInTokenResponseSchema, userInfoSchema, type UserInfo } from './schemas'
import * as bp from '.botpress'

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'
const OAUTH_REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

const ACCESS_TOKEN_BUFFER_MS = 5 * 60 * 1000 // 5 minutes
const REFRESH_TOKEN_BUFFER_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const ACCESS_TOKEN_EXPIRED_ISSUE_TITLE = 'Access token expired'
const ACCESS_TOKEN_EXPIRED_ISSUE_DESC =
  'The LinkedIn api access token is expired or expiring within 7 days and no refresh token is available. Please re-authorize the integration through the OAuth flow.'
const REFRESH_TOKEN_EXPIRED_ISSUE_TITLE = 'Refresh token expired'
const REFRESH_TOKEN_EXPIRED_ISSUE_DESC =
  'The LinkedIn api refresh token is expired or expiring within 7 days. Please re-authorize the integration through the OAuth flow.'

type OAuthCredentialsPayload = bp.states.oauthCredentials.OauthCredentials['payload']

type ClientCredentials = {
  clientId: string
  clientSecret: string
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
    const parseResult = linkedInErrorResponseSchema.safeParse(await responseClone.json())
    if (parseResult.success) {
      const errorData = parseResult.data
      errorMessage = `${errorData.message ?? 'Unknown error'} (serviceErrorCode: ${errorData.serviceErrorCode ?? 'N/A'})`
    } else {
      errorMessage = await response.text()
    }
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
  private _logger: bp.Logger

  private constructor({
    credentials,
    client,
    ctx,
    clientId,
    clientSecret,
    logger,
  }: {
    credentials: OAuthCredentialsPayload
    client: bp.Client
    ctx: bp.Context
    clientId: string
    clientSecret: string
    logger: bp.Logger
  }) {
    this._credentials = credentials
    this._client = client
    this._ctx = ctx
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._logger = logger
  }

  /**
   * Creates OAuth client using Botpress's official LinkedIn app credentials.
   * Used for automatic OAuth configuration flow.
   */
  public static async createFromAuthorizationCode({
    authorizationCode,
    client,
    ctx,
    logger,
  }: {
    authorizationCode: string
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<LinkedInOAuthClient> {
    const clientCredentials = LinkedInOAuthClient._getBotpressClientCredentials()
    return LinkedInOAuthClient._exchangeCodeForTokens({
      authorizationCode,
      clientCredentials,
      client,
      ctx,
      logger,
    })
  }

  public static async createFromManualConfig({
    authorizationCode,
    clientId,
    clientSecret,
    client,
    ctx,
    logger,
  }: {
    authorizationCode: string
    clientId: string
    clientSecret: string
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<LinkedInOAuthClient> {
    return LinkedInOAuthClient._exchangeCodeForTokens({
      authorizationCode,
      clientCredentials: { clientId, clientSecret },
      client,
      ctx,
      logger,
    })
  }

  public static async createFromState({
    client,
    ctx,
    logger,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
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
      logger,
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
    logger,
  }: {
    authorizationCode: string
    clientCredentials: ClientCredentials
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<LinkedInOAuthClient> {
    logger.forBot().debug('Exchanging authorization code for LinkedIn tokens')

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
      logger.forBot().error('Failed to exchange authorization code for LinkedIn tokens', {
        status: response.status,
      })
      throw new sdk.RuntimeError(errorMsg)
    }

    const tokenData = linkedInTokenResponseSchema.parse(await response.json())
    logger.forBot().debug('Successfully obtained LinkedIn tokens')

    logger.forBot().debug('Fetching LinkedIn user info')
    const userInfo = await LinkedInOAuthClient._fetchUserInfo(tokenData.access_token, logger)

    const credentials = LinkedInOAuthClient._generateCredentials(tokenData, userInfo.sub)
    const oauthClient = new LinkedInOAuthClient({
      credentials,
      client,
      ctx,
      clientId: clientCredentials.clientId,
      clientSecret: clientCredentials.clientSecret,
      logger,
    })
    await oauthClient._saveCredentials()

    logger.forBot().debug('LinkedIn OAuth credentials saved successfully')

    return oauthClient
  }

  private async _refreshTokenIfNeeded(): Promise<void> {
    const now = new Date().getTime()

    if (!this._credentials.refreshToken) {
      if (this._credentials.accessToken.expiresAt <= now + REFRESH_TOKEN_BUFFER_MS) {
        this._logger.issue({
          type: 'issue',
          title: ACCESS_TOKEN_EXPIRED_ISSUE_TITLE,
          description: ACCESS_TOKEN_EXPIRED_ISSUE_DESC,
          category: 'configuration',
          groupBy: ['access_token_expired'],
          code: 'access_token_expired',
          data: {
            details: {
              raw: ACCESS_TOKEN_EXPIRED_ISSUE_TITLE,
              pretty: ACCESS_TOKEN_EXPIRED_ISSUE_DESC,
            },
            expiryDate: {
              raw: new Date(this._credentials.accessToken.expiresAt).toISOString(),
            },
          },
        })
      }
      return
    }

    if (this._credentials.accessToken.expiresAt > now + ACCESS_TOKEN_BUFFER_MS) {
      return
    }

    this._logger.forBot().debug('LinkedIn access token expired or expiring soon, refreshing')

    if (this._credentials.refreshToken.expiresAt) {
      if (this._credentials.refreshToken.expiresAt <= now + REFRESH_TOKEN_BUFFER_MS) {
        this._logger.issue({
          type: 'issue',
          title: REFRESH_TOKEN_EXPIRED_ISSUE_TITLE,
          description: REFRESH_TOKEN_EXPIRED_ISSUE_DESC,
          category: 'configuration',
          groupBy: ['refresh_token_expired'],
          code: 'refresh_token_expired',
          data: {
            details: {
              raw: REFRESH_TOKEN_EXPIRED_ISSUE_TITLE,
              pretty: REFRESH_TOKEN_EXPIRED_ISSUE_DESC,
            },
            expiryDate: {
              raw: new Date(this._credentials.refreshToken.expiresAt).toISOString(),
            },
          },
        })
      }
    }

    await this._refreshAccessToken()
  }

  private async _refreshAccessToken(): Promise<void> {
    if (!this._credentials.refreshToken) {
      throw new sdk.RuntimeError('No refresh token available')
    }

    this._logger.forBot().debug('Refreshing LinkedIn access token')

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
        this._logger.forBot().error('LinkedIn refresh token is expired, revoked, or invalid', {
          status: response.status,
          ...headers,
        })
        throw new sdk.RuntimeError(
          'LinkedIn refresh token has expired, been revoked, or is invalid. ' +
            'Please re-authorize the integration through the OAuth flow to obtain a new refresh token. ' +
            `(x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
        )
      }

      this._logger.forBot().error('Failed to refresh LinkedIn access token', {
        status: response.status,
        ...headers,
      })
      throw new sdk.RuntimeError(
        `Failed to refresh LinkedIn access token: ${errorText} ` +
          `(x-li-uuid: ${headers['x-li-uuid']}, x-li-request-id: ${headers['x-li-request-id']})`
      )
    }

    const tokenData = linkedInTokenResponseSchema.parse(await response.json())
    this._credentials = LinkedInOAuthClient._generateCredentials(
      tokenData,
      this._credentials.linkedInUserId,
      this._credentials.grantedScopes
    )
    await this._saveCredentials()
    this._logger.forBot().debug('LinkedIn access token refreshed successfully')
  }

  private async _saveCredentials(): Promise<void> {
    await this._client.setState({
      type: 'integration',
      name: 'oauthCredentials',
      id: this._ctx.integrationId,
      payload: this._credentials,
    })
  }

  private static _generateCredentials(
    tokenData: sdk.z.infer<typeof linkedInTokenResponseSchema>,
    userId: string,
    defaultScopes?: string[]
  ) {
    defaultScopes = defaultScopes ?? []
    const now = new Date().getTime()
    return {
      accessToken: {
        token: tokenData.access_token,
        issuedAt: now,
        expiresAt: now + tokenData.expires_in * 1000,
      },
      refreshToken: tokenData.refresh_token
        ? {
            token: tokenData.refresh_token,
            issuedAt: now,
            expiresAt: tokenData.refresh_token_expires_in ? now + tokenData.refresh_token_expires_in * 1000 : undefined,
          }
        : undefined,
      grantedScopes: tokenData.scope ? tokenData.scope.split(' ') : defaultScopes,
      linkedInUserId: userId,
    }
  }

  private static async _fetchUserInfo(accessToken: string, logger: bp.Logger): Promise<UserInfo> {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorMsg = await formatLinkedInError(response, 'Failed to fetch LinkedIn user info')
      logger.forBot().error('Failed to fetch LinkedIn user info', { status: response.status })
      throw new sdk.RuntimeError(errorMsg)
    }

    logger.forBot().debug('Successfully fetched LinkedIn user info')
    return userInfoSchema.parse(await response.json())
  }

  private static _getBotpressClientCredentials(): ClientCredentials {
    return {
      clientId: bp.secrets.CLIENT_ID,
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
