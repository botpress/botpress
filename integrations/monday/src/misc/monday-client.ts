import axios, { Axios } from 'axios'
import { GRAPHQL_QUERIES, QUERY_INPUT, QUERY_RESPONSE } from './graphql-queries'

export type MondayClientConfiguration = {
  authorization: string
}

type MondayOAuthTokenResponse = {
  access_token: string
}

export type MondayOAuthCredentials = {
  accessToken: string
}

export type ExchangeCodeForTokensInput = {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}

export type CreateItemOptions = {
  name: string
}

export type Item = {
  id: string
  name: string
}

export type ItemsPageResponse = {
  items: Item[]
  nextToken: string | undefined
}

export const exchangeCodeForTokens = async ({
  clientId,
  clientSecret,
  redirectUri,
  code,
}: ExchangeCodeForTokensInput): Promise<MondayOAuthCredentials> => {
  const response = await axios.post<MondayOAuthTokenResponse>('https://auth.monday.com/oauth2/token', {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  })

  return {
    accessToken: response.data.access_token,
  }
}

export class MondayClient {
  private constructor(private readonly _client: Axios) {}

  public static create(config: MondayClientConfiguration) {
    const client = axios.create({
      baseURL: 'https://api.monday.com/v2',
      timeout: 10_000,
      headers: {
        Authorization: config.authorization,
        'API-Version': '2023-07',
        'Content-Type': 'application/json',
      },
    })

    return new MondayClient(client)
  }

  private async _executeGraphqlQuery<K extends keyof GRAPHQL_QUERIES>(
    queryName: K,
    variables: GRAPHQL_QUERIES[K][QUERY_INPUT]
  ): Promise<GRAPHQL_QUERIES[K][QUERY_RESPONSE]> {
    const response = await this._client.post('', {
      query: GRAPHQL_QUERIES[queryName].query,
      variables,
    })

    return response.data.data
  }

  public async validateAccessToken(): Promise<void> {
    try {
      const response = await this._executeGraphqlQuery('validateAccessToken', {})
      if (!Array.isArray(response.boards)) {
        throw new Error('Monday credentials validation returned an unexpected response.')
      }
    } catch (thrown) {
      throw thrown instanceof Error ? thrown : new Error('Monday credentials validation failed.')
    }
  }

  public async createItem(
    boardId: string,
    item: CreateItemOptions
  ): Promise<GRAPHQL_QUERIES['createItem'][QUERY_RESPONSE]> {
    return await this._executeGraphqlQuery('createItem', {
      boardId,
      itemName: item.name,
    })
  }
}
