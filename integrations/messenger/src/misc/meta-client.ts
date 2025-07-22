import { z, RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

const ERROR_SUBSCRIBE_TO_WEBHOOKS = 'Failed to subscribe to webhooks'
const ERROR_UNSUBSCRIBE_FROM_WEBHOOKS = 'Failed to unsubscribe from webhooks'

export class MetaClient {
  private _clientId: string
  private _clientSecret: string
  private _version: string = 'v19.0'
  private _baseGraphApiUrl = 'https://graph.facebook.com'

  public constructor(private _logger: bp.Logger) {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async exchangeAuthorizationCodeForAccessToken(code: string, redirectUri: string) {
    const query = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      redirect_uri: redirectUri,
      code,
    })

    const res = await axios.get(`${this._baseGraphApiUrl}/${this._version}/oauth/access_token?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
      })
      .parse(res.data)

    return data.access_token
  }

  public async getFacebookPagesFromToken(inputToken: string): Promise<{ id: string; name: string }[]> {
    const query = new URLSearchParams({
      input_token: inputToken,
      access_token: bp.secrets.ACCESS_TOKEN,
    })

    const { data: dataDebugToken } = await axios.get(
      `${this._baseGraphApiUrl}/${this._version}/debug_token?${query.toString()}`
    )

    const scope = dataDebugToken.data.granular_scopes.find(
      (item: { scope: string; target_ids: string[] }) => item.scope === 'pages_messaging'
    )

    if (scope.target_ids) {
      const ids = scope.target_ids

      const { data: dataBusinesses } = await axios.get(
        `${this._baseGraphApiUrl}/${this._version}/?ids=${ids.join()}&fields=id,name`,
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

  public async getPageToken(accessToken: string, pageId: string) {
    const query = new URLSearchParams({
      access_token: accessToken,
      fields: 'access_token,name',
    })

    const res = await axios.get(`${this._baseGraphApiUrl}/${pageId}?${query.toString()}`)
    const data = z
      .object({
        access_token: z.string(),
        name: z.string(),
        id: z.string(),
      })
      .parse(res.data)

    if (!data.access_token) {
      throw new RuntimeError('Unable to find the page token for the specified page')
    }

    return data.access_token
  }

  public async subscribeToWebhooks(pageToken: string, pageId: string) {
    const { data } = await axios
      .post(
        `${this._baseGraphApiUrl}/${this._version}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ['messages', 'messaging_postbacks'],
        },
        {
          headers: {
            Authorization: 'Bearer ' + pageToken,
          },
        }
      )
      .catch((err) => {
        this._logger.error(`Error subscribing to webhooks for Page ${pageId}: ${err}`)
        throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
      })

    if (!data.success) {
      throw new RuntimeError(ERROR_SUBSCRIBE_TO_WEBHOOKS)
    }
  }

  public async unsubscribeFromWebhooks(pageToken: string, pageId: string) {
    const { data } = await axios
      .delete(`${this._baseGraphApiUrl}/${this._version}/${pageId}/subscribed_apps`, {
        headers: {
          Authorization: 'Bearer ' + pageToken,
        },
      })
      .catch((err) => {
        this._logger.error(`Error unsubscribing from webhooks for Page ${pageId}: ${err}`)
        throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
      })

    if (!data.success) {
      throw new RuntimeError(ERROR_UNSUBSCRIBE_FROM_WEBHOOKS)
    }
  }

  public async getUserManagedPages(userToken: string) {
    let allPages: { id: string; name: string }[] = []

    const query = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name',
    })
    let url = `${this._baseGraphApiUrl}/${this._version}/me/accounts?${query.toString()}`

    while (url) {
      const response = await axios.get(url).catch((err) => {
        this._logger.error(`Error fetching pages: ${err}`)
        throw new RuntimeError('Error fetching pages')
      })

      // Add the pages to the allPages array
      allPages = allPages.concat(response.data.data)

      // Check if there's a next page
      url = response.data.paging && response.data.paging.next ? response.data.paging.next : null
    }

    return allPages
  }
}
