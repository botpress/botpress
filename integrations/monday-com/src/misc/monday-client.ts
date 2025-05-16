import axios, { Axios } from 'axios'
import { WebhookNames } from './custom-schemas'
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

export type ItemsPageResponse = {
  items: Item[]
  nextToken: string | undefined
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
    webhookEvent: WebhookNames,
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

  public async getItemsPage(boardId: string, nextToken: string | undefined = undefined): Promise<ItemsPageResponse> {
    const limit = 500

    const result = nextToken
      ? await this._executeGraphqlQuery('getNextItemsPage', { limit, boardId, cursor: nextToken })
      : await this._executeGraphqlQuery('getItemsPage', { limit, boardId })

    if (result.boards.length === 0) return { items: [], nextToken: undefined }

    return {
      items: result.boards[0]!.items_page.items,
      nextToken: result.boards[0]!.items_page.cursor || undefined,
    }
  }

  public async *getItems(boardId: string): AsyncGenerator<Array<Item>> {
    let page = await this.getItemsPage(boardId)
    if (page.items.length === 0) return
    yield page.items

    while (page.nextToken) {
      page = await this.getItemsPage(boardId, page.nextToken)
      if (page.items.length === 0) return
      yield page.items
    }
  }
}
