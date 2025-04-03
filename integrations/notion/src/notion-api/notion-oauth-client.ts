import { Client as NotionHQClient } from '@notionhq/client'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import * as bp from '.botpress'

const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

export class NotionOAuthClient {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _notion: NotionHQClient

  public constructor({ ctx, client }: { client: bp.Client; ctx: bp.Context }) {
    this._client = client
    this._ctx = ctx

    this._notion = new NotionHQClient({})
  }

  @handleErrors('Failed to get access token. Please reconfigure the integration.')
  public async getNewAccessToken() {
    const { authToken } = await this._getAuthState()

    return { accessToken: authToken }
  }

  @handleErrors('Failed to exchange authorization code. Please reconfigure the integration.')
  public async processAuthorizationCode(authorizationCode: string): Promise<{ workspaceId: string }> {
    const result = await this._exchangeAuthorizationCodeForAccessToken(authorizationCode)

    await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'oauth',
      payload: {
        authToken: result.access_token,
      },
    })

    return { workspaceId: result.workspace_id }
  }

  private async _exchangeAuthorizationCodeForAccessToken(authorizationCode: string) {
    const response = await this._notion.oauth.token({
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: REDIRECT_URI,
    })

    return response
  }

  private async _getAuthState(): Promise<bp.states.oauth.Oauth['payload']> {
    const { state } = await this._client.getState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'oauth',
    })

    return state.payload
  }
}
