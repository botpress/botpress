import { Client } from '@botpress/client'
import { Axios } from 'axios'
import { createItemSchema, itemsTableSchema, syncItemsSchema } from 'src/misc/custom-schemas'
import { IntegrationProps, Client as EventClient } from '.botpress'
import { getClient, getVanillaClient } from 'src/utils'

type CreateItem = IntegrationProps['actions']['createItem']
type SyncItems = IntegrationProps['actions']['syncItems']

const ensureMondayItemsTableExists = async (client: EventClient) =>
  await getVanillaClient(client).getOrCreateTable({
    table: 'MondayItemsTable',
    schema: itemsTableSchema.toJsonSchema({ target: 'jsonSchema7' }),
  })

type Item = {
  id: string
  name: string
}
async function* getItems(apiClient: Axios, boardId: string): AsyncGenerator<Array<Item>> {
  let response = await apiClient.post('', {
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
    response = await apiClient.post('', {
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

export const syncItems: SyncItems = async (event) => {
  await ensureMondayItemsTableExists(event.client)

  const input = syncItemsSchema.parse(event.input)
  const client = getClient(event.ctx.configuration)
  const bpClient = getVanillaClient(event.client)

  for await (const batch of getItems(client, input.boardId)) {
    event.logger.info('upserted', batch.length)
    const response = await bpClient.upsertTableRows({
      table: 'MondayItemsTable',
      keyColumn: 'itemId',
      rows: batch.map((item) => ({
        boardId: input.boardId,
        itemId: item.id,
        name: item.name,
      })),
    })
    if (response.errors) {
      for (const err of response.errors) {
        event.logger.error('upsert error', err)
      }
    }
    event.logger.info('inserted', response.inserted.length)
    event.logger.info('updated', response.updated.length)
  }
  event.logger.info('done upserting')

  return {}
}

export const createItem: CreateItem = async (event) => {
  await ensureMondayItemsTableExists(event.client)

  const input = createItemSchema.parse(event.input)
  const client = getClient(event.ctx.configuration)

  const resp = await client.post('', {
    query: `mutation CreateNewItem($boardId: ID!, $itemName: String!) {
    create_item (board_id: $boardId, item_name: $itemName) {
      id
    }
  }`,
    variables: {
      boardId: input.boardId,
      itemName: input.itemName,
    },
  })

  event.logger.forBot().info(resp.status)
  event.logger.forBot().info(JSON.stringify(resp.data, null, 2))

  // Call Monday.com graphql api
  return {}
}
