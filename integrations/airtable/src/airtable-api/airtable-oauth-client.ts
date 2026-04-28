import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { handleErrorsDecorator as handleErrors } from '../api/error-handling'
import * as bp from '.botpress'

type AirtableTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
  scope: string
}

type PrivateAuthState = {
  readonly accessToken: {
    readonly issuedAt: Date
    readonly expiresAt: Date
    readonly token: string
  }
  readonly refreshToken: {
    readonly issuedAt: Date
    readonly token: string
  }
  readonly scopes: string[]
}

type PublicAuthState = {
  readonly accessToken: string
  readonly scopes: string[]
}

const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token'
const MINIMUM_TOKEN_VALIDITY_SECONDS = 7_200 // 2 hours

export class AirtableOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _logger: bp.Logger
  private readonly _clientId: string
  private readonly _clientSecret: string
  private _currentAuthState: PrivateAuthState | undefined = undefined

  public constructor({
    ctx,
    client,
    logger,
    clientIdOverride,
    clientSecretOverride,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
    clientIdOverride?: string
    clientSecretOverride?: string
  }) {
    this._clientId = clientIdOverride ?? bp.secrets.CLIENT_ID
    this._clientSecret = clientSecretOverride ?? bp.secrets.CLIENT_SECRET
    this._client = client
    this._ctx = ctx
    this._logger = logger
  }

  @handleErrors('Failed to refresh Airtable credentials')
  public async getAuthState(): Promise<PublicAuthState> {
    const manualCredentials = await this._getManualCredentialsState()
    if (manualCredentials) {
      this._personalAccessToken = manualCredentials.personalAccessToken
      return {
        accessToken: manualCredentials.personalAccessToken,
        scopes: [],
      }
    }

    await this._refreshAuthStateIfNeeded()

    if (!this._currentAuthState) {
      throw new sdk.RuntimeError('No credentials found')
    }

    return {
      accessToken: this._currentAuthState.accessToken.token,
      scopes: this._currentAuthState.scopes,
    }
  }

  public readonly requestShortLivedCredentials = {
    fromAuthorizationCode: async (authorizationCode: string, codeVerifier: string, redirectUri: string) => {
      this._logger.forBot().debug('Exchanging authorization code for short-lived credentials...')

      const response = await this._postToken({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      })

      this._currentAuthState = this._parseAirtableTokenResponse(response)
      await this._saveOAuthCredentials()

      this._logger.debug('Successfully exchanged authorization code')
    },

    fromRefreshToken: async (refreshToken: string) => {
      this._logger.forBot().debug('Exchanging refresh token for short-lived credentials...')

      const response = await this._postToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })

      this._currentAuthState = this._parseAirtableTokenResponse(response)
      await this._saveOAuthCredentials()

      this._logger.debug('Successfully exchanged refresh token')
    },
  }

  @handleErrors('Failed to save Airtable personal access token')
  public async savePersonalAccessToken(personalAccessToken: string): Promise<void> {
    await this._client.setState({
      type: 'integration',
      name: 'manualCredentials',
      id: this._ctx.integrationId,
      payload: { personalAccessToken },
    })
    this._personalAccessToken = personalAccessToken
  }

  private async _postToken(body: Record<string, string>): Promise<AirtableTokenResponse> {
    const basicAuth = Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64')
    const response = await axios.post<AirtableTokenResponse>(AIRTABLE_TOKEN_URL, new URLSearchParams(body).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
    })
    return response.data
  }

  private async _refreshAuthStateIfNeeded(): Promise<void> {
    if (this._isTokenStillValid()) {
      return
    }

    const credentials = await this._getOAuthCredentialsState()

    if (!credentials) {
      throw new sdk.RuntimeError('No credentials found')
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
    try {
      const { state } = await this._client.getState({
        type: 'integration',
        id: this._ctx.integrationId,
        name: 'manualCredentials',
      })
      return state.payload
    } catch {}
    return
  }

  private async _getOAuthCredentialsState() {
    try {
      const { state } = await this._client.getState({
        type: 'integration',
        id: this._ctx.integrationId,
        name: 'oAuthCredentials',
      })
      return state.payload
    } catch {}
    return
  }

  private async _refreshAuth(credentials: bp.states.oAuthCredentials.OAuthCredentials['payload']) {
    const tokenExpiresAt = new Date(credentials.expiresAt)

    if (tokenExpiresAt > this._getMinExpiryDate()) {
      this._currentAuthState = {
        accessToken: {
          expiresAt: tokenExpiresAt,
          issuedAt: tokenExpiresAt, // not persisted; only expiry matters for validity check
          token: credentials.accessToken,
        },
        refreshToken: {
          issuedAt: tokenExpiresAt,
          token: credentials.refreshToken,
        },
        scopes: credentials.scopes,
      }
      return
    }

    await this.requestShortLivedCredentials.fromRefreshToken(credentials.refreshToken)
  }

  private _parseAirtableTokenResponse(response: AirtableTokenResponse): PrivateAuthState {
    if (!response.access_token || !response.refresh_token || !response.expires_in || !response.scope) {
      console.error('Airtable OAuth response is missing required fields', response)
      throw new sdk.RuntimeError('OAuth response is missing required fields')
    }

    if (response.expires_in < MINIMUM_TOKEN_VALIDITY_SECONDS) {
      console.error('Airtable OAuth response has an invalid expiration time', response.expires_in)
      throw new sdk.RuntimeError('OAuth response has an invalid expiration time')
    }

    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getTime() + response.expires_in * 1000)

    return {
      accessToken: {
        issuedAt,
        expiresAt,
        token: response.access_token,
      },
      refreshToken: {
        issuedAt,
        token: response.refresh_token,
      },
      scopes: response.scope.split(' '),
    } as const
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
        scopes: this._currentAuthState.scopes,
      },
    })
  }
}
