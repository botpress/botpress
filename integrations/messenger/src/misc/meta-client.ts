import { z, RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { getMetaClientCredentials } from './auth'
import { MetaClientCredentials, MetaClientConfigType } from './types'
import { makeMetaErrorHandler } from './utils'
import * as bp from '.botpress'

const ERROR_SUBSCRIBE_TO_WEBHOOKS = 'Failed to subscribe to webhooks'
const ERROR_UNSUBSCRIBE_FROM_WEBHOOKS = 'Failed to unsubscribe from webhooks'
const FIELDS_TO_SUBSCRIBE = ['messages', 'messaging_postbacks', 'feed']
export class MetaClient {
  private _userToken?: string
  private _pageToken?: string
  private _pageId?: string
  private _clientId: string
  private _baseUrl = 'https://graph.facebook.com/v23.0'
  private _clientSecret?: string
  private _appToken?: string
  private _logger?: bp.Logger

  public constructor(config: MetaClientCredentials, logger?: bp.Logger) {
    this._userToken = config.userToken
    this._pageToken = config.pageToken
    this._pageId = config.pageId
    this._clientId = config.clientId
    this._clientSecret = config.clientSecret
    this._appToken = config.appToken
    this._logger = logger
  }

  // Helper method for making Facebook API requests
  private async _makeRequest<T = any>({
    method,
    endpoint,
    customHeaders,
    data,
    tokenType,
  }: {
    method: 'GET' | 'POST' | 'DELETE'
    endpoint: string
    customHeaders?: Record<string, string>
    data?: any
    tokenType?: 'user' | 'page' | 'none'
  }): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this._baseUrl}/${endpoint}`
    let authHeader
    if (tokenType === 'page') {
      authHeader = this._getPageTokenAuthorizationHeader()
    } else if (tokenType === 'none') {
      authHeader = {}
    } else {
      authHeader = this._getUserTokenAuthorizationHeader()
    }

    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(customHeaders ?? {}),
    }

    const response = await axios({
      method,
      url,
      data,
      headers,
    }).catch(makeMetaErrorHandler(url))

    return response.data
  }

  // OAuth Methods
  public async exchangeAuthorizationCodeForAccessToken(code: string, redirectUri: string) {
    const query = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._getClientSecret(),
      redirect_uri: redirectUri,
      code,
    })

    const data = await this._makeRequest({
      method: 'GET',
      endpoint: `oauth/access_token?${query.toString()}`,
      tokenType: 'none',
    }).catch(() => {
      // Don't log original error, client secret is in the URL
      const errorMsg = 'Error exchanging authorization code for access token'
      this._logger?.forBot().error(errorMsg)
      throw new RuntimeError(errorMsg)
    })
    const parsedData = z
      .object({
        access_token: z.string(),
      })
      .parse(data)

    return parsedData.access_token
  }

  public setPageToken(pageToken: string) {
    this._pageToken = pageToken
  }

  public async getPageToken(inputPageId?: string) {
    const pageId = this._getPageId(inputPageId)
    const query = new URLSearchParams({
      fields: 'access_token',
      access_token: this._getUserToken(),
    })

    const data = await this._makeRequest({
      method: 'GET',
      endpoint: `${pageId}?${query.toString()}`,
      tokenType: 'none',
    })
    const parsedData = z
      .object({
        access_token: z.string(),
      })
      .parse(data)

    if (!parsedData.access_token) {
      throw new RuntimeError('Unable to find the page token for the specified page')
    }

    return parsedData.access_token
  }

  public async getFacebookPagesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: this._getAppToken(),
    })

    const dataDebugToken = await this._makeRequest({
      method: 'GET',
      endpoint: `debug_token?${query.toString()}`,
      tokenType: 'none',
    })

    const scope = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging'
    )

    if (scope.target_ids) {
      const ids = scope.target_ids

      const dataBusinesses = await this._makeRequest({
        method: 'GET',
        endpoint: `?ids=${ids.join()}&fields=id,name`,
        tokenType: 'none',
        customHeaders: {
          Authorization: `Bearer ${inputToken}`,
        },
      })

      return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
    } else {
      return this.getUserManagedPagesFromToken(inputToken)
    }
  }

  public async getUserManagedPagesFromToken(userToken: string) {
    let allPages: { id: string; name: string }[] = []

    const query = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name',
    })
    let url = `${this._baseUrl}/me/accounts?${query.toString()}`

    while (url) {
      const response = await this._makeRequest({
        method: 'GET',
        endpoint: url,
        tokenType: 'none',
      })

      // Add the pages to the allPages array
      allPages = allPages.concat(response.data.data)

      // Check if there's a next page
      url = response.data.paging && response.data.paging.next ? response.data.paging.next : null
    }

    return allPages
  }

  // Webhook Methods
  public async subscribeToWebhooks(inputPageId?: string) {
    const pageId = this._getPageId(inputPageId)
    try {
      const responseData = await this._makeRequest({
        method: 'POST',
        endpoint: `${pageId}/subscribed_apps`,
        tokenType: 'page',
        data: {
          subscribed_fields: FIELDS_TO_SUBSCRIBE,
        },
      })

      if (!responseData.success) {
        throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
      }
    } catch (error) {
      this._logger?.error(`Error subscribing to webhooks for Page ${pageId}: ${error}`)
      throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
    }
  }

  public async unsubscribeFromWebhooks(inputPageId?: string) {
    const pageId = this._getPageId(inputPageId)
    try {
      const responseData = await this._makeRequest({
        method: 'DELETE',
        endpoint: `${pageId}/subscribed_apps`,
        tokenType: 'page',
      })

      if (!responseData || !responseData.success) {
        throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
      }
    } catch (error) {
      this._logger?.error(`Error unsubscribing from webhooks for Page ${pageId}: ${error}`)
      throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
    }
  }

  public async getSubscribedWebhooks(inputPageId?: string): Promise<string[] | undefined> {
    const pageId = this._getPageId(inputPageId)
    const responseData = await this._makeRequest({
      method: 'GET',
      endpoint: `${pageId}/subscribed_apps`,
      tokenType: 'page',
    })

    const { data: applications } = z
      .array(z.object({ id: z.string(), subscribed_fields: z.array(z.string()) }))
      .safeParse(responseData.data)

    const application = applications?.find((app) => app.id === this._clientId)
    if (!application) {
      return undefined
    }

    return application.subscribed_fields
  }

  public async isSubscribedToWebhooks(inputPageId?: string) {
    const subscribedFields = await this.getSubscribedWebhooks(inputPageId)

    if (!subscribedFields) {
      return false
    }

    if (!FIELDS_TO_SUBSCRIBE.every((f) => subscribedFields.includes(f))) {
      return false
    }

    return true
  }

  // Helper Methods
  private _getPageId(inputPageId?: string) {
    const pageId = inputPageId ?? this._pageId
    if (!pageId) {
      throw new RuntimeError('Page ID is not set and no page ID was provided')
    }
    return pageId
  }

  private _getClientSecret() {
    if (!this._clientSecret) {
      throw new RuntimeError('Client secret is not set')
    }
    return this._clientSecret
  }

  private _getUserToken() {
    if (!this._userToken) {
      throw new RuntimeError('User token is not set')
    }
    return this._userToken
  }

  private _getPageToken() {
    if (!this._pageToken) {
      throw new RuntimeError('Page token is not set')
    }
    return this._pageToken
  }

  private _getPageTokenAuthorizationHeader() {
    return {
      Authorization: `Bearer ${this._getPageToken()}`,
    }
  }

  private _getUserTokenAuthorizationHeader() {
    return {
      Authorization: `Bearer ${this._getUserToken()}`,
    }
  }

  private _getAppToken() {
    if (!this._appToken) {
      throw new RuntimeError('App token is not set')
    }
    return this._appToken
  }
}

// Factory Function
export async function createAuthenticatedMetaClient({
  configType,
  ctx,
  client,
  logger,
}: {
  configType?: MetaClientConfigType
  ctx: bp.Context
  client: bp.Client
  logger?: bp.Logger
}): Promise<MetaClient> {
  const credentials = await getMetaClientCredentials({ configType, client, ctx })
  return new MetaClient(credentials, logger)
}
