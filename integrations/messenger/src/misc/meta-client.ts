import { z, RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { getPartialMetaClientCredentials } from './auth'
import { MetaClientConfig } from './types'
import * as bp from '.botpress'

const ERROR_SUBSCRIBE_TO_WEBHOOKS = 'Failed to subscribe to webhooks'
const ERROR_UNSUBSCRIBE_FROM_WEBHOOKS = 'Failed to unsubscribe from webhooks'

export class MetaClient {
  private _userAccessToken: string
  private _clientId: string
  private _clientSecret: string
  private _baseUrl = 'https://graph.facebook.com/v23.0'
  private _logger?: bp.Logger

  public constructor(config: MetaClientConfig, logger?: bp.Logger) {
    this._userAccessToken = config.accessToken
    this._clientId = config.clientId
    this._clientSecret = config.clientSecret
    this._logger = logger
  }

  // Helper method for making Facebook API requests
  private async _makeRequest<T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this._baseUrl}/${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._userAccessToken}`,
      ...customHeaders,
    }

    const response = await axios({
      method,
      url,
      data,
      headers,
    })

    return response.data
  }

  // OAuth Methods

  public async exchangeAuthorizationCodeForAccessToken(code: string, redirectUri: string) {
    const query = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      redirect_uri: redirectUri,
      code,
    })

    const res = await axios.get(`${this._baseUrl}/oauth/access_token?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }

  public setPageToken(pageToken: string) {
    this._userAccessToken = pageToken
  }

  public async getPageToken(pageId: string) {
    const query = new URLSearchParams({
      fields: 'access_token',
      access_token: this._userAccessToken,
    })

    const res = await axios.get(`${this._baseUrl}/${pageId}?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    if (!data.access_token) {
      throw new RuntimeError('Unable to find the page token for the specified page')
    }

    return data.access_token
  }

  public async getFacebookPagesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(`${this._baseUrl}/debug_token?${query.toString()}`)

    const scope = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging'
    )

    if (scope.target_ids) {
      const ids = scope.target_ids

      const { data: dataBusinesses } = await axios.get(`${this._baseUrl}/?ids=${ids.join()}&fields=id,name`, {
        headers: {
          Authorization: `Bearer ${inputToken}`,
        },
      })

      return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
    } else {
      return this.getUserManagedPages(inputToken)
    }
  }

  public async getUserManagedPages(userToken: string) {
    let allPages: { id: string; name: string }[] = []

    const query = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name',
    })
    let url = `${this._baseUrl}/me/accounts?${query.toString()}`

    while (url) {
      const response = await axios.get(url).catch((err) => {
        this._logger?.error(`Error fetching pages: ${err}`)
        throw new RuntimeError('Error fetching pages')
      })

      // Add the pages to the allPages array
      allPages = allPages.concat(response.data.data)

      // Check if there's a next page
      url = response.data.paging && response.data.paging.next ? response.data.paging.next : null
    }

    return allPages
  }

  // Webhook Methods

  public async subscribeToWebhooks(pageId: string) {
    try {
      const responseData = await this._makeRequest('POST', `${pageId}/subscribed_apps`, {
        subscribed_fields: ['messages', 'messaging_postbacks', 'feed'],
      })

      if (!responseData.success) {
        throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
      }
    } catch (error) {
      this._logger?.error(`Error subscribing to webhooks for Page ${pageId}: ${error}`)
      throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
    }
  }

  public async unsubscribeFromWebhooks(pageId: string) {
    try {
      const responseData = await this._makeRequest('DELETE', `${pageId}/subscribed_apps`, undefined)

      if (!responseData || !responseData.success) {
        throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
      }
    } catch (error) {
      this._logger?.error(`Error unsubscribing from webhooks for Page ${pageId}: ${error}`)
      throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
    }
  }

  public async isSubscribedToWebhooks(pageId: string) {
    const responseData = await this._makeRequest('GET', `${pageId}/subscribed_apps`, undefined)
    const { data: applications } = z.array(z.object({ id: z.string() })).safeParse(responseData.data)
    return applications?.some((app) => app.id === this._clientId) ?? false
  }
}

// Factory Function
export async function createMetaClient(ctx: bp.Context, client?: bp.Client, logger?: bp.Logger): Promise<MetaClient> {
  let accessToken: string
  let clientId: string
  let clientSecret: string

  if (ctx.configurationType === 'manual') {
    accessToken = ctx.configuration.accessToken
    clientId = ctx.configuration.clientId
    clientSecret = ctx.configuration.clientSecret || ''
  } else {
    // For OAuth configurations
    if (!client) {
      throw new Error('Client is required for OAuth configuration')
    }
    const credentials = await getPartialMetaClientCredentials(client, ctx)

    accessToken = credentials.accessToken || ''
    clientId = bp.secrets.CLIENT_ID
    clientSecret = bp.secrets.CLIENT_SECRET
  }

  return new MetaClient(
    {
      accessToken,
      clientId,
      clientSecret,
    },
    logger
  )
}
