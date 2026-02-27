import * as sdk from '@botpress/sdk'
import { DropboxAuth } from 'dropbox'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import * as bp from '.botpress'

export const getOAuthClientId = ({ ctx }: { ctx: bp.Context }) =>
  ctx.configurationType === 'manual' ? ctx.configuration.clientId : bp.secrets.APP_KEY

export const getOAuthClientSecret = ({ ctx }: { ctx: bp.Context }) =>
  ctx.configurationType === 'manual' ? ctx.configuration.clientSecret : bp.secrets.APP_SECRET

export const getAuthorizationCode = ({ ctx }: { ctx: bp.Context }): string | undefined => {
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.authorizationCode
  }
  return undefined
}

export class DropboxOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _dropboxAuth: DropboxAuth

  public constructor({ ctx, client }: { client: bp.Client; ctx: bp.Context }) {
    this._client = client
    this._ctx = ctx

    this._dropboxAuth = new DropboxAuth({
      clientId: getOAuthClientId({ ctx }),
      clientSecret: getOAuthClientSecret({ ctx }),
    })
  }

  public async getNewAccessToken() {
    const { refreshToken, accountId, grantedScopes } = await this._getAuthState()
    const accessToken = await this._exchangeRefreshTokenForAccessToken(refreshToken)

    return { accessToken, accountId, grantedScopes }
  }

  @handleErrors('Failed to exchange authorization code. Please reconfigure the integration.')
  public async processAuthorizationCode(authorizationCode: string, redirectUri: string): Promise<void> {
    const result = await this._exchangeAuthorizationCodeForRefreshToken(authorizationCode, redirectUri)

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

  private async _exchangeAuthorizationCodeForRefreshToken(authorizationCode: string, redirectUri: string) {
    const response = await this._dropboxAuth.getAccessTokenFromCode(redirectUri, authorizationCode)

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
    try {
      const result = await this._client.getState({
        id: this._ctx.integrationId,
        type: 'integration',
        name: 'authorization',
      })

      if (!result?.state?.payload) {
        throw new Error('Authorization state not found. Please complete the OAuth wizard to configure the integration.')
      }

      return result.state.payload
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error(
        'Failed to retrieve authorization state. Please complete the OAuth wizard to configure the integration.'
      )
    }
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
