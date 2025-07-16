import * as sdk from '@botpress/sdk'
import { DropboxAuth } from 'dropbox'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import * as bp from '.botpress'

export class DropboxOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _dropboxAuth: DropboxAuth

  public constructor({ ctx, client }: { client: bp.Client; ctx: bp.Context }) {
    this._client = client
    this._ctx = ctx

    this._dropboxAuth = new DropboxAuth({
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
    })
  }

  public async getNewAccessToken() {
    const { refreshToken, accountId, grantedScopes } = await this._getAuthState()
    const accessToken = await this._exchangeRefreshTokenForAccessToken(refreshToken)

    return { accessToken, accountId, grantedScopes }
  }

  @handleErrors('Failed to exchange authorization code. Please reconfigure the integration.')
  public async processAuthorizationCode(authorizationCode: string): Promise<void> {
    const result = await this._exchangeAuthorizationCodeForRefreshToken(authorizationCode)

    await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'authorization',
      payload: {
        refreshToken: result.refresh_token,
        accountId: result.account_id,
        grantedScopes: result.scope.split(' '),
        authorizationCode,
      },
    })
  }

  private async _exchangeAuthorizationCodeForRefreshToken(authorizationCode: string) {
    const response = await this._dropboxAuth.getAccessTokenFromCode('', authorizationCode)

    // NOTE: DropboxAuth.getAccessTokenFromCode is not properly typed: the
    // response is not an empty object, but an object with the following properties:
    const result = sdk.z
      .object({
        access_token: sdk.z.string().optional(),
        refresh_token: sdk.z.string().min(1),
        token_type: sdk.z.literal('bearer'),
        scope: sdk.z.string().min(1),
        account_id: sdk.z.string().min(1),
      })
      .parse(response.result)

    // NOTE: the zod schema serves as a sanity check to ensure the response
    // does indeed contain the expected properties.

    return result
  }

  @handleErrors('Failed to get authorization state. Please reconfigure the integration.')
  private async _getAuthState(): Promise<bp.states.authorization.Authorization['payload']> {
    const { state } = await this._client.getState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'authorization',
    })

    return state.payload
  }

  @handleErrors('Failed to exchange refresh token for access token')
  private async _exchangeRefreshTokenForAccessToken(refreshToken: string): Promise<string> {
    this._dropboxAuth.setRefreshToken(refreshToken)

    // NOTE: DropboxAuth.refreshAccessToken is not properly typed: it actually
    // returns a promise, not void
    await (this._dropboxAuth.refreshAccessToken() as unknown as Promise<void>)

    return this._dropboxAuth.getAccessToken()
  }
}
