import { MondayClient } from 'src/misc/monday-client'
import { getVanillaClient } from 'src/utils'
import { IntegrationProps } from '.botpress'

type CreateItem = IntegrationProps['actions']['createItem']
type SyncItems = IntegrationProps['actions']['syncItems']

export const syncItems: SyncItems = async (event) => {
  const boardId = event.input.boardId

  const monday = MondayClient.create({
    personalAccessToken: event.ctx.configuration.personalAccessToken,
  })

  const client = getVanillaClient(event.client)

  const page = await monday.getItemsPage(boardId, event.input.nextToken)

  if (page.items.length > 0) {
    const response = await client.upsertTableRows({
      table: 'MondayItemsTable',
      keyColumn: 'itemId',
      rows: page.items.map((item) => ({
        boardId,
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
    event.logger.info('done upserting')
  }

  return { nextToken: page.nextToken }
}

export const createItem: CreateItem = async ({ input, ctx }) => {
  const client = MondayClient.create({
    personalAccessToken: ctx.configuration.personalAccessToken,
  })

  await client.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}
