import * as sdk from '@botpress/sdk'
import { type OauthV2AccessResponse, WebClient as SlackWebClient } from '@slack/web-api'
import { handleErrorsDecorator as handleErrors, redactSlackError } from './error-handling'
import * as bp from '.botpress'

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
  readonly botUserId: string
  readonly teamId: string
}
type PublicAuthState = {
  readonly accessToken: string
  readonly scopes: string[]
  readonly botUserId: string
  readonly teamId: string
}

const MINIMUM_TOKEN_VALIDITY_SECONDS = 7_200 // 2 hours

export class SlackOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _logger: bp.Logger
  private readonly _clientId: string
  private readonly _clientSecret: string
  private readonly _slackClient: SlackWebClient
  private _currentAuthState: PrivateAuthState | undefined = undefined

  public constructor({ ctx, client, logger }: { client: bp.Client; ctx: bp.Context; logger: bp.Logger }) {
    this._clientId = ctx.configurationType === 'refreshToken' ? ctx.configuration.clientId : bp.secrets.CLIENT_ID
    this._clientSecret =
      ctx.configurationType === 'refreshToken' ? ctx.configuration.clientSecret : bp.secrets.CLIENT_SECRET
    this._slackClient = new SlackWebClient()
    this._client = client
    this._ctx = ctx
    this._logger = logger
  }

  @handleErrors('Failed to refresh Slack credentials')
  public async getAuthState(): Promise<PublicAuthState> {
    await this._refreshAuthStateIfNeeded()

    if (!this._currentAuthState) {
      throw new sdk.RuntimeError('No credentials found')
    }

    return {
      accessToken: this._currentAuthState.accessToken.token,
      scopes: this._currentAuthState.scopes,
      botUserId: this._currentAuthState.botUserId,
      teamId: this._currentAuthState.teamId,
    }
  }

  public readonly requestShortLivedCredentials = {
    /**
     * Exchanges an OAuth callback authorization code for short-lived rotating
     * credentials. This code path is used once when the user selects automatic
     * configuration using our Botpress Slack app.
     */
    fromAuthorizationCode: async (authorizationCode: string) => {
      this._logger.forBot().debug('Exchanging authorization code for short-lived credentials...')

      const response = await this._slackClient.oauth.v2
        .access({
          client_id: this._clientId,
          client_secret: this._clientSecret,
          redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
          grant_type: 'authorization_code',
          code: authorizationCode,
        })
        .catch((thrown) => {
          throw redactSlackError(thrown, 'Failed to exchange authorization code')
        })

      this._currentAuthState = this._parseSlackOAuthResponse(response)
      await this._saveCredentialsV2()

      this._logger.debug('Successfully exchanged & revoked authorization code')
    },

    /**
     * Exchanges a single-use refresh token for short-lived rotating
     * credentials. This code path is used once when the user chooses manual
     * configuration and provides a single-use refresh token, or when the user
     * chooses automatic configuration and the credentials are about to expire.
     */
    fromRefreshToken: async (refreshToken: string) => {
      this._logger.forBot().debug('Exchanging refresh token for short-lived credentials...')

      const response = await this._slackClient.oauth.v2
        .access({
          client_id: this._clientId,
          client_secret: this._clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        })
        .catch((thrown) => {
          throw redactSlackError(thrown, 'Failed to exchange refresh token')
        })

      this._currentAuthState = this._parseSlackOAuthResponse(response)
      await this._saveCredentialsV2()

      this._logger.debug('Successfully exchanged & revoked refresh token')
    },

    /**
     * Exchanges a long-lived bot token for short-lived rotating credentials.
     * This code path is used when the user previously used manual configuration
     * before the integration supported rotating credentials.
     */
    fromLegacyBotToken: async (legacyBotToken: string) => {
      this._logger.forBot().debug('Exchanging legacy bot token for short-lived credentials...')

      const exchangeClient = new SlackWebClient(legacyBotToken)

      const response = await exchangeClient.oauth.v2
        .exchange({
          client_id: this._clientId,
          client_secret: this._clientSecret,
        })
        .catch((thrown) => {
          throw redactSlackError(thrown, 'Failed to exchange bot token')
        })

      this._currentAuthState = this._parseSlackOAuthResponse(response)
      await this._saveCredentialsV2()

      this._logger.debug('Successfully exchanged & revoked legacy bot token')
    },
  }

  private async _refreshAuthStateIfNeeded(): Promise<void> {
    if (this._isTokenStillValid()) {
      return
    }

    const credentialsV2 = await this._getCredentialsStateV2()

    if (credentialsV2) {
      return await this._refreshAuthV2(credentialsV2)
    }

    const credentialsV1 = await this._getCredentialsStateV1()

    if (credentialsV1) {
      return await this.requestShortLivedCredentials.fromLegacyBotToken(credentialsV1.accessToken)
    }

    throw new sdk.RuntimeError('No credentials found')
  }

  private _isTokenStillValid() {
    return this._currentAuthState && this._currentAuthState.accessToken.expiresAt > this._getMinExpiryDate()
  }

  private _getMinExpiryDate() {
    return new Date(Date.now() + MINIMUM_TOKEN_VALIDITY_SECONDS * 1000)
  }

  private async _getCredentialsStateV2() {
    try {
      const { state: credentialsV2 } = await this._client.getState({
        type: 'integration',
        id: this._ctx.integrationId,
        name: 'oAuthCredentialsV2',
      })

      return credentialsV2.payload
    } catch {}
    return
  }

  /**
   * @deprecated - Remove this entire code path when we remove the 'credentials' state
   */
  private async _getCredentialsStateV1() {
    try {
      const { state: credentialsV1 } = await this._client.getState({
        type: 'integration',
        id: this._ctx.integrationId,
        name: 'credentials',
      })

      return credentialsV1.payload
    } catch {}
    return
  }

  private async _refreshAuthV2(credentials: bp.states.oAuthCredentialsV2.OAuthCredentialsV2['payload']) {
    const { shortLivedAccessToken, rotatingRefreshToken, grantedScopes, botUserId, teamId } = credentials

    const tokenExpiresAt = new Date(shortLivedAccessToken.expiresAt)

    if (tokenExpiresAt > this._getMinExpiryDate()) {
      this._currentAuthState = {
        accessToken: {
          expiresAt: tokenExpiresAt,
          issuedAt: new Date(shortLivedAccessToken.issuedAt),
          token: shortLivedAccessToken.currentAccessToken,
        },
        refreshToken: {
          issuedAt: new Date(rotatingRefreshToken.issuedAt),
          token: rotatingRefreshToken.token,
        },
        scopes: grantedScopes,
        botUserId,
        teamId,
      }
      return
    }

    await this.requestShortLivedCredentials.fromRefreshToken(rotatingRefreshToken.token)
  }

  private _parseSlackOAuthResponse(response: OauthV2AccessResponse): PrivateAuthState {
    if (
      !response.access_token ||
      !response.refresh_token ||
      !response.expires_in ||
      !response.scope ||
      !response.bot_user_id ||
      !response.team?.id
    ) {
      console.error('Slack OAuth response is missing required fields', response)
      throw new sdk.RuntimeError('OAuth response is missing required fields')
    }

    if (response.expires_in < MINIMUM_TOKEN_VALIDITY_SECONDS) {
      console.error('Slack OAuth response has an invalid expiration time', response.expires_in)
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
      scopes: response.scope.split(','),
      botUserId: response.bot_user_id,
      teamId: response.team.id,
    } as const
  }

  private async _saveCredentialsV2() {
    if (!this._currentAuthState) {
      throw new sdk.RuntimeError('No credentials to save')
    }

    await this._client.setState({
      type: 'integration',
      name: 'oAuthCredentialsV2',
      id: this._ctx.integrationId,
      payload: {
        shortLivedAccessToken: {
          currentAccessToken: this._currentAuthState.accessToken.token,
          issuedAt: this._currentAuthState.accessToken.issuedAt.toISOString(),
          expiresAt: this._currentAuthState.accessToken.expiresAt.toISOString(),
        },
        rotatingRefreshToken: {
          token: this._currentAuthState.refreshToken.token,
          issuedAt: this._currentAuthState.refreshToken.issuedAt.toISOString(),
        },
        grantedScopes: this._currentAuthState.scopes,
        botUserId: this._currentAuthState.botUserId,
        teamId: this._currentAuthState.teamId,
      },
    })
  }
}
