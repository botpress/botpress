import axios, { Axios } from 'axios'
import { GRAPHQL_QUERIES, QUERY_INPUT, QUERY_RESPONSE } from './graphql-queries'

export type MondayClientConfiguration = {
  personalAccessToken: string
}

export type CreateItemOptions = {
  name: string
}

export type Item = {
  id: string
  name: string
}

export class MondayClient {
  private constructor(private readonly _client: Axios) {}

  public static create(config: MondayClientConfiguration) {
    const client = axios.create({
      baseURL: 'https://api.monday.com/v2',
      timeout: 10_000,
      headers: {
        Authorization: config.personalAccessToken,
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

  public async createWebhook(
    webhookEvent: 'create_item',
    webhookUrl: string,
    boardId: string
  ): Promise<GRAPHQL_QUERIES['createWebhook'][QUERY_RESPONSE]> {
    return await this._executeGraphqlQuery('createWebhook', {
      boardId,
      webhookUrl,
      event: webhookEvent,
    })
  }

  public async deleteWebhook(webhookId: string): Promise<GRAPHQL_QUERIES['deleteWebhook'][QUERY_RESPONSE]> {
    return await this._executeGraphqlQuery('deleteWebhook', {
      webhookId,
    })
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

  public async *getItems(boardId: string): AsyncGenerator<Array<Item>> {
    let response = await this._client.post('', {
      query: `query GetItems($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 5) {
          cursor
          items {
            id
            name
            group { id }
          }
        }
      }
    }`,
      variables: { boardId },
    })

    if (response.data.data.boards.length === 0) return
    if (response.data.data.boards[0].items_page.items.length === 0) return

    yield response.data.data.boards[0].items_page.items
    let cursor = response.data.data.boards[0].items_page.cursor

    while (cursor !== null) {
      response = await this._client.post('', {
        query: `query GetItems($boardId: ID!, $cursor: String!) {
          boards(ids: [$boardId]) {
            items_page(limit: 25, cursor: $cursor) {
              cursor
              items {
                id
                name
                group { id }
              }
            }
          }
  }`,
        variables: { boardId, cursor },
      })

      if (response.data.data.boards.length === 0) return
      if (response.data.data.boards[0].items_page.items.length === 0) return

      yield response.data.data.boards[0].items_page.items
      cursor = response.data.data.boards[0].items_page.cursor
    }
  }
}
