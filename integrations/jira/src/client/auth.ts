import { isApiError, RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

type AtlassianTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

type AccessibleResource = {
  id: string
  name: string
  url: string
  scopes: string[]
}

const ATLASSIAN_TOKEN_URL = 'https://auth.atlassian.com/oauth/token'
const ATLASSIAN_ACCESSIBLE_RESOURCES_URL = 'https://api.atlassian.com/oauth/token/accessible-resources'
const MINIMUM_TOKEN_VALIDITY_SECONDS = 300

export class JiraOAuthClient {
  public constructor(
    private readonly _props: {
      client: bp.Client
      ctx: bp.Context
      logger: bp.Logger
    }
  ) {}

  public async getAccessToken(): Promise<string> {
    const credentials = await this._getOAuthCredentials()
    if (!credentials) {
      throw new RuntimeError('No Jira OAuth credentials found. Re-run the Jira setup wizard.')
    }

    if (new Date(credentials.expiresAt) > this._getMinExpiryDate()) {
      return credentials.accessToken
    }

    return await this.refreshAccessToken(credentials.refreshToken)
  }

  public async exchangeAuthorizationCode(code: string, redirectUri: string): Promise<string> {
    const token = await this._postToken({
      grant_type: 'authorization_code',
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    })

    await this._saveOAuthCredentials(token)
    return token.access_token
  }

  public async refreshAccessToken(refreshToken: string): Promise<string> {
    const token = await this._postToken({
      grant_type: 'refresh_token',
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      refresh_token: refreshToken,
    })

    await this._saveOAuthCredentials(token, refreshToken)
    return token.access_token
  }

  public async listAccessibleJiraResources(accessToken: string): Promise<AccessibleResource[]> {
    const response = await fetch(ATLASSIAN_ACCESSIBLE_RESOURCES_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new RuntimeError(`Failed to list accessible Jira sites: ${response.status} ${await response.text()}`)
    }

    const resources = (await response.json()) as AccessibleResource[]
    return resources.filter((resource) => resource.scopes.some((scope) => scope.includes('jira')))
  }

  public async saveManualCredentials(credentials: bp.states.manualCredentials.ManualCredentials['payload']) {
    await this._props.client.setState({
      type: 'integration',
      name: 'manualCredentials',
      id: this._props.ctx.integrationId,
      payload: credentials,
    })
    await this.clearOAuthCredentials()
  }

  public async clearManualCredentials() {
    await this._props.client.setState({
      type: 'integration',
      name: 'manualCredentials',
      id: this._props.ctx.integrationId,
      payload: { host: 'https://cleared.atlassian.net', email: 'cleared@example.com', apiToken: '' },
    })
  }

  public async clearOAuthCredentials() {
    await this._props.client.setState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: this._props.ctx.integrationId,
      payload: {
        accessToken: '',
        refreshToken: '',
        expiresAt: new Date(0).toISOString(),
        scopes: [],
      },
    })
  }

  private async _postToken(body: Record<string, string>): Promise<AtlassianTokenResponse> {
    const response = await fetch(ATLASSIAN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new RuntimeError(`Failed to exchange Jira OAuth token: ${response.status} ${await response.text()}`)
    }

    const token = (await response.json()) as AtlassianTokenResponse
    if (!token.access_token || !token.expires_in) {
      this._props.logger.forBot().error('Atlassian OAuth token response is missing required fields')
      throw new RuntimeError('Jira OAuth response is missing required fields')
    }
    return token
  }

  private async _getOAuthCredentials() {
    return this._props.client
      .getState({
        type: 'integration',
        name: 'oAuthCredentials',
        id: this._props.ctx.integrationId,
      })
      .then(({ state }) => state.payload)
      .catch((e: unknown) => {
        if (isApiError(e) && e.type === 'ResourceNotFound') {
          return undefined
        }
        this._props.logger.forBot().error('Failed to read Jira OAuth credentials state', { error: e })
        throw e
      })
  }

  private async _saveOAuthCredentials(token: AtlassianTokenResponse, previousRefreshToken?: string) {
    const refreshToken = token.refresh_token ?? previousRefreshToken
    if (!refreshToken) {
      throw new RuntimeError('Jira OAuth response did not include a refresh token')
    }

    await this._props.client.setState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: this._props.ctx.integrationId,
      payload: {
        accessToken: token.access_token,
        refreshToken,
        expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        scopes: token.scope ? token.scope.split(' ') : [],
      },
    })
  }

  private _getMinExpiryDate() {
    return new Date(Date.now() + MINIMUM_TOKEN_VALIDITY_SECONDS * 1000)
  }
}
