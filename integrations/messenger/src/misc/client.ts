import { z } from '@botpress/sdk'
import axios from 'axios'
import { getGlobalWebhookUrl } from '../index'
import * as bp from '.botpress'

export class MetaClient {
  private clientId: string
  private clientSecret: string
  private version: string = 'v19.0'
  private baseGraphApiUrl = 'https://graph.facebook.com'

  constructor(private logger: bp.Logger) {
    this.clientId = bp.secrets.CLIENT_ID
    this.clientSecret = bp.secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const query = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: getGlobalWebhookUrl(),
      code,
    })

    const res = await axios.get(`${this.baseGraphApiUrl}/${this.version}/oauth/access_token?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }

  async getFacebookPagesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(
      `${this.baseGraphApiUrl}/${this.version}/debug_token?${query.toString()}`
    )

    const scope = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging'
    )

    if (scope.target_ids) {
      const ids = scope.target_ids

      const { data: dataBusinesses } = await axios.get(
        `${this.baseGraphApiUrl}/${this.version}/?ids=${ids.join()}&fields=id,name`,
        {
          headers: {
            Authorization: `Bearer ${inputToken}`,
          },
        }
      )

      return Object.keys(dataBusinesses).map((key) => dataBusinesses[key])
    } else {
      return this.getUserManagedPages(inputToken)
    }
  }

  async getPageToken(accessToken: string, pageId: string) {
    const query = new URLSearchParams({
      access_token: accessToken,
      fields: 'access_token,name',
    })

    const res = await axios.get(`${this.baseGraphApiUrl}/${pageId}?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
        name: z.string(),
        id: z.string(),
      })
      .parse(res.data)

    if (!data.access_token) {
      throw new Error('Unable to find the page token for the specified page')
    }

    return data.access_token
  }

  async subscribeToWebhooks(pageToken: string, pageId: string) {
    try {
      const { data } = await axios.post(
        `${this.baseGraphApiUrl}/${this.version}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ['messages', 'messaging_postbacks'],
        },
        {
          headers: {
            Authorization: 'Bearer ' + pageToken,
          },
        }
      )

      if (!data.success) {
        throw new Error('No Success')
      }
    } catch (e: any) {
      this.logger
        .forBot()
        .error(
          `(OAuth registration) Error subscribing to webhooks for Page ${pageId}: ${e.message} -> ${e.response?.data}`
        )
      throw new Error('Issue subscribing to Webhooks for Page, please try again.')
    }
  }

  async getUserManagedPages(userToken: string) {
    let allPages: { id: string; name: string }[] = []

    const query = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name',
    })
    let url = `${this.baseGraphApiUrl}/${this.version}/me/accounts?${query.toString()}`

    try {
      while (url) {
        const response = await axios.get(url)

        // Add the pages to the allPages array
        allPages = allPages.concat(response.data.data)

        // Check if there's a next page
        url = response.data.paging && response.data.paging.next ? response.data.paging.next : null
      }

      return allPages
    } catch (err: any) {
      throw new Error('Error fetching pages:' + err.response ? err.response.data : err.message)
    }
  }
}

export async function getCredentials(
  client: bp.Client,
  ctx: bp.Context
): Promise<{ accessToken: string; clientSecret: string; clientId: string }> {
  if (ctx.configuration.useManualConfiguration) {
    // Use access token from configuration if manual configuration is enabled
    return ctx.configuration
  }

  // Otherwise use the page token obtained from the OAuth flow and stored in the state
  const { state } = await client.getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })

  if (!state.payload.pageToken) {
    throw new Error('There is no access token, please reauthorize')
  }

  return {
    accessToken: state.payload.pageToken,
    clientSecret: bp.secrets.CLIENT_SECRET,
    clientId: bp.secrets.CLIENT_ID,
  }
}
