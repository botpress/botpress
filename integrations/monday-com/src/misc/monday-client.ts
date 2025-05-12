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
    const limit = 25

    const result = await this._executeGraphqlQuery('getItemsPage', {
      limit,
      boardId,
    })
    if (result.boards.length === 0) return
    if (result.boards[0]!.items_page.items.length === 0) return

    yield result.boards[0]!.items_page.items
    let cursor = result.boards[0]!.items_page.cursor

    while (cursor !== null) {
      const next_result = await this._executeGraphqlQuery('getNextItemsPage', {
        limit,
        boardId,
        cursor,
      })

      if (next_result.boards.length === 0) return
      if (next_result.boards[0]!.items_page.items.length === 0) return
      yield next_result.boards[0]!.items_page.items
      cursor = next_result.boards[0]!.items_page.cursor
    }
  }
}
