import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

type StripeTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  stripe_user_id: string
  stripe_publishable_key?: string
  livemode: boolean
  scope?: string
  expires_in?: number
  refresh_expires_in?: number
}

type PrivateAuthState = {
  readonly accessToken: {
    readonly expiresAt: Date
    readonly token: string
  }
  readonly refreshToken: {
    readonly expiresAt: Date
    readonly token: string
  }
  readonly scopes: string[]
  readonly stripeUserId: string
  readonly livemode: boolean
}

type PublicAuthState = {
  readonly accessToken: string
  readonly scopes: string[]
  readonly stripeUserId?: string
  readonly livemode?: boolean
}

const STRIPE_TOKEN_URL = 'https://api.stripe.com/v1/oauth/token'
const MINIMUM_TOKEN_VALIDITY_SECONDS = 3_600
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3_600
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60

export class StripeOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _logger: bp.Logger
  private readonly _clientSecret: string
  private _currentAuthState: PrivateAuthState | undefined = undefined

  public constructor({
    ctx,
    client,
    logger,
    clientSecretOverride,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
    clientSecretOverride?: string
  }) {
    this._clientSecret = clientSecretOverride ?? bp.secrets.CLIENT_SECRET
    this._client = client
    this._ctx = ctx
    this._logger = logger
  }

  public async getAuthState(): Promise<PublicAuthState> {
    const manual = await this._getManualCredentialsState()
    if (manual && manual.apiKey !== '') {
      return { accessToken: manual.apiKey, scopes: [] }
    }

    await this._refreshAuthStateIfNeeded()

    if (!this._currentAuthState) {
      throw new sdk.RuntimeError('No Stripe credentials found. Re-run the integration setup wizard.')
    }

    return {
      accessToken: this._currentAuthState.accessToken.token,
      scopes: this._currentAuthState.scopes,
      stripeUserId: this._currentAuthState.stripeUserId,
      livemode: this._currentAuthState.livemode,
    }
  }

  public readonly requestShortLivedCredentials = {
    fromAuthorizationCode: async (authorizationCode: string) => {
      this._logger.forBot().debug('Exchanging Stripe authorization code for credentials...')
      const response = await this._postToken({ grant_type: 'authorization_code', code: authorizationCode })
      this._currentAuthState = this._parseStripeTokenResponse(response)
      await this._saveOAuthCredentials()
      await this._clearManualCredentials()
      this._logger.forBot().debug('Successfully exchanged Stripe authorization code')
    },

    fromRefreshToken: async (refreshToken: string) => {
      this._logger.forBot().debug('Refreshing Stripe access token...')
      const response = await this._postToken({ grant_type: 'refresh_token', refresh_token: refreshToken })
      this._currentAuthState = this._parseStripeTokenResponse(response)
      await this._saveOAuthCredentials()
      this._logger.forBot().debug('Successfully refreshed Stripe access token')
    },
  }

  public async saveManualApiKey(apiKey: string): Promise<void> {
    await this._client.setState({
      type: 'integration',
      name: 'manualCredentials',
      id: this._ctx.integrationId,
      payload: { apiKey },
    })
    await this._clearOAuthCredentials()
  }

  private async _postToken(body: Record<string, string>): Promise<StripeTokenResponse> {
    const basicAuth = Buffer.from(`${this._clientSecret}:`).toString('base64')
    const response = await fetch(STRIPE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams(body).toString(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      this._logger.forBot().error(`Stripe token endpoint returned ${response.status}: ${errorBody}`)
      throw new sdk.RuntimeError(`Stripe token request failed (${response.status})`)
    }

    return (await response.json()) as StripeTokenResponse
  }

  private async _refreshAuthStateIfNeeded(): Promise<void> {
    if (this._isTokenStillValid()) {
      return
    }

    const credentials = await this._getOAuthCredentialsState()
    if (!credentials) {
      throw new sdk.RuntimeError('No Stripe credentials found. Re-run the integration setup wizard.')
    }

    await this._refreshAuth(credentials)
  }

  private _isTokenStillValid() {
    return this._currentAuthState && this._currentAuthState.accessToken.expiresAt > this._getMinExpiryDate()
  }

  private _getMinExpiryDate() {
    return new Date(Date.now() + MINIMUM_TOKEN_VALIDITY_SECONDS * 1000)
  }

  private async _getManualCredentialsState() {
    return this._client
      .getState({ type: 'integration', id: this._ctx.integrationId, name: 'manualCredentials' })
      .then(({ state }) => state.payload)
      .catch(() => undefined)
  }

  private async _getOAuthCredentialsState() {
    return this._client
      .getState({ type: 'integration', id: this._ctx.integrationId, name: 'oAuthCredentials' })
      .then(({ state }) => state.payload)
      .catch(() => undefined)
  }

  private async _refreshAuth(credentials: bp.states.oAuthCredentials.OAuthCredentials['payload']) {
    const accessTokenExpiresAt = new Date(credentials.expiresAt)
    const refreshTokenExpiresAt = new Date(credentials.refreshExpiresAt)

    if (refreshTokenExpiresAt <= new Date()) {
      throw new sdk.RuntimeError('Stripe refresh token has expired. Please re-run the integration setup wizard.')
    }

    if (accessTokenExpiresAt > new Date()) {
      this._currentAuthState = {
        accessToken: { expiresAt: accessTokenExpiresAt, token: credentials.accessToken },
        refreshToken: { expiresAt: refreshTokenExpiresAt, token: credentials.refreshToken },
        scopes: credentials.scopes,
        stripeUserId: credentials.stripeUserId,
        livemode: credentials.livemode,
      }
      return
    }

    await this.requestShortLivedCredentials.fromRefreshToken(credentials.refreshToken)
  }

  private _parseStripeTokenResponse(response: StripeTokenResponse): PrivateAuthState {
    if (!response.access_token || !response.refresh_token || !response.stripe_user_id) {
      this._logger.forBot().error('Stripe OAuth response is missing required fields')
      throw new sdk.RuntimeError('Stripe OAuth response is missing required fields')
    }

    const now = Date.now()
    const accessTtl = response.expires_in ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS
    const refreshTtl = response.refresh_expires_in ?? DEFAULT_REFRESH_TOKEN_TTL_SECONDS

    return {
      accessToken: { expiresAt: new Date(now + accessTtl * 1000), token: response.access_token },
      refreshToken: { expiresAt: new Date(now + refreshTtl * 1000), token: response.refresh_token },
      scopes: response.scope ? response.scope.split(' ') : [],
      stripeUserId: response.stripe_user_id,
      livemode: response.livemode ?? false,
    }
  }

  private async _clearManualCredentials() {
    await this._client.setState({
      type: 'integration',
      name: 'manualCredentials',
      id: this._ctx.integrationId,
      payload: { apiKey: '' },
    })
  }

  private async _clearOAuthCredentials() {
    const epoch = new Date(0).toISOString()
    await this._client.setState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: this._ctx.integrationId,
      payload: {
        accessToken: '',
        refreshToken: '',
        expiresAt: epoch,
        refreshExpiresAt: epoch,
        scopes: [],
        stripeUserId: '',
        livemode: false,
      },
    })
  }

  private async _saveOAuthCredentials() {
    if (!this._currentAuthState) {
      throw new sdk.RuntimeError('No credentials to save')
    }

    await this._client.setState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: this._ctx.integrationId,
      payload: {
        accessToken: this._currentAuthState.accessToken.token,
        refreshToken: this._currentAuthState.refreshToken.token,
        expiresAt: this._currentAuthState.accessToken.expiresAt.toISOString(),
        refreshExpiresAt: this._currentAuthState.refreshToken.expiresAt.toISOString(),
        scopes: this._currentAuthState.scopes,
        stripeUserId: this._currentAuthState.stripeUserId,
        livemode: this._currentAuthState.livemode,
      },
    })
  }
}
