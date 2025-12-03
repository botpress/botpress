import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import * as oauthWizard from '../oauth-wizard'
import type * as types from './types'

type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
type GoogleJWTClient = InstanceType<(typeof google.auth)['JWT']>
type GoogleAuthClient = GoogleOAuth2Client | GoogleJWTClient

const DEFAULT_STATE_NAME = 'oAuthConfig'

/**
 * Centralized Google OAuth client for all Google integrations.
 *
 * This class handles:
 * - OAuth2 authentication flow (authorization code exchange)
 * - Service Account (JWT) authentication
 * - Refresh token storage and retrieval
 * - Token refresh
 *
 * @example
 * ```typescript
 * // Create the OAuth client
 * const googleOAuth = new GoogleOAuthClient({
 *   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
 *   credentials: {
 *     clientId: bp.secrets.CLIENT_ID,
 *     clientSecret: bp.secrets.CLIENT_SECRET,
 *   },
 * })
 *
 * // Get authenticated client for API calls
 * const authClient = await googleOAuth.getAuthenticatedClient({ ctx, client })
 * const sheets = google.sheets({ version: 'v4', auth: authClient })
 *
 * // Handle OAuth callback
 * await googleOAuth.exchangeAuthorizationCode({ ctx, client, authorizationCode })
 * ```
 */
export class GoogleOAuthClient {
  private readonly _config: Required<Omit<types.GoogleOAuthConfig, 'serviceAccount'>> & {
    serviceAccount?: types.ServiceAccountConfig
  }

  public constructor(config: types.GoogleOAuthConfig) {
    this._config = {
      scopes: config.scopes,
      stateName: config.stateName ?? DEFAULT_STATE_NAME,
      endpointStrategy: config.endpointStrategy ?? { type: 'default' },
      credentials: config.credentials,
      serviceAccount: config.serviceAccount,
    }
  }

  /**
   * Get an authenticated Google auth client.
   *
   * If service account config is provided, returns a JWT client.
   * Otherwise, returns an OAuth2 client with the stored refresh token.
   */
  public async getAuthenticatedClient({
    ctx,
    client,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
  }): Promise<GoogleAuthClient> {
    if (this._config.serviceAccount) {
      return this._createJWTClient(this._config.serviceAccount)
    }

    return this._getOAuth2ClientWithRefreshToken({ ctx, client })
  }

  /**
   * Exchange an authorization code for a refresh token and save it.
   *
   * This should be called when handling the OAuth callback after
   * the user authorizes the integration.
   */
  public async exchangeAuthorizationCode({
    ctx,
    client,
    authorizationCode,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
    authorizationCode: string
  }): Promise<string> {
    const oauth2Client = this._createPlainOAuth2Client()

    const { tokens } = await oauth2Client.getToken({ code: authorizationCode })

    if (!tokens.refresh_token) {
      throw new sdk.RuntimeError('Unable to obtain refresh token. Please try the OAuth flow again.')
    }

    await this._saveRefreshToken({ ctx, client, refreshToken: tokens.refresh_token })

    return tokens.refresh_token
  }

  /**
   * Get an access token from the stored refresh token.
   *
   * Useful when you need the raw access token (e.g., for direct API calls).
   */
  public async getAccessToken({
    ctx,
    client,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
  }): Promise<string> {
    const oauth2Client = await this._getOAuth2ClientWithRefreshToken({ ctx, client })
    const { token } = await oauth2Client.getAccessToken()

    if (!token) {
      throw new sdk.RuntimeError('Unable to obtain access token. Please try the OAuth flow again.')
    }

    return token
  }

  /**
   * Get the stored refresh token from state.
   */
  public async getRefreshToken({
    ctx,
    client,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
  }): Promise<string> {
    const { state } = await client.getState({
      id: ctx.integrationId,
      type: 'integration',
      name: this._config.stateName,
    })

    const refreshToken = state.payload.refreshToken
    if (typeof refreshToken !== 'string') {
      throw new sdk.RuntimeError('Refresh token not found in state. Please complete the OAuth flow first.')
    }
    return refreshToken
  }

  /**
   * Save a refresh token to state.
   *
   * This is useful when you already have a refresh token
   * (e.g., from a previous OAuth flow or external source).
   */
  public async saveRefreshToken({
    ctx,
    client,
    refreshToken,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
    refreshToken: string
  }): Promise<void> {
    await this._saveRefreshToken({ ctx, client, refreshToken })
  }

  /**
   * Get the OAuth endpoint URL based on the configured strategy.
   */
  public getOAuthEndpoint(): string {
    return this._getEndpointUrl()
  }

  /**
   * Create a plain OAuth2 client (without credentials set).
   *
   * This is useful for generating authorization URLs.
   */
  public createPlainOAuth2Client(): GoogleOAuth2Client {
    return this._createPlainOAuth2Client()
  }

  /**
   * Generate an authorization URL for the OAuth flow.
   *
   * @param additionalParams - Additional parameters to include in the URL
   */
  public generateAuthorizationUrl(additionalParams?: {
    state?: string
    accessType?: 'online' | 'offline'
    prompt?: string
    includeGrantedScopes?: boolean
  }): string {
    const oauth2Client = this._createPlainOAuth2Client()

    return oauth2Client.generateAuthUrl({
      access_type: additionalParams?.accessType ?? 'offline',
      scope: this._config.scopes,
      state: additionalParams?.state,
      prompt: additionalParams?.prompt ?? 'consent',
      include_granted_scopes: additionalParams?.includeGrantedScopes,
    })
  }

  private _createPlainOAuth2Client(): GoogleOAuth2Client {
    return new google.auth.OAuth2(
      this._config.credentials.clientId,
      this._config.credentials.clientSecret,
      this._getEndpointUrl()
    )
  }

  private _createJWTClient(serviceAccount: types.ServiceAccountConfig): GoogleJWTClient {
    return new google.auth.JWT({
      email: serviceAccount.clientEmail,
      key: serviceAccount.privateKey.split(String.raw`\n`).join('\n'),
      scopes: this._config.scopes,
      subject: serviceAccount.impersonateEmail,
    })
  }

  private async _getOAuth2ClientWithRefreshToken({
    ctx,
    client,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
  }): Promise<GoogleOAuth2Client> {
    const oauth2Client = this._createPlainOAuth2Client()
    const refreshToken = await this.getRefreshToken({ ctx, client })

    oauth2Client.setCredentials({ refresh_token: refreshToken })

    return oauth2Client
  }

  private async _saveRefreshToken({
    ctx,
    client,
    refreshToken,
  }: {
    ctx: types.BaseClientContext
    client: types.GenericBpClient
    refreshToken: string
  }): Promise<void> {
    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: this._config.stateName,
      payload: { refreshToken },
    })
  }

  private _getEndpointUrl(): string {
    const { endpointStrategy } = this._config

    switch (endpointStrategy.type) {
      case 'default':
        return `${process.env.BP_WEBHOOK_URL}/oauth`

      case 'wizard':
        return oauthWizard.getWizardStepUrl(endpointStrategy.stepName).href

      case 'custom':
        return endpointStrategy.endpoint

      default:
        return `${process.env.BP_WEBHOOK_URL}/oauth`
    }
  }
}
