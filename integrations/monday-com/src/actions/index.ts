import { createItemSchema, syncItemsSchema } from 'src/misc/custom-schemas'
import { MondayClient } from 'src/misc/monday-client'
import { getVanillaClient } from 'src/utils'
import { IntegrationProps } from '.botpress'

type CreateItem = IntegrationProps['actions']['createItem']
type SyncItems = IntegrationProps['actions']['syncItems']

export const syncItems: SyncItems = async (event) => {
  const input = syncItemsSchema.parse(event.input)
  const client = MondayClient.create({
    personalAccessToken: event.ctx.configuration.personalAccessToken,
  })
  const bpClient = getVanillaClient(event.client)

  for await (const batch of client.getItems(input.boardId)) {
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
  const input = createItemSchema.parse(event.input)

  const client = MondayClient.create({
    personalAccessToken: event.ctx.configuration.personalAccessToken,
  })

  await client.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}
