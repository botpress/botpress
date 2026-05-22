import { getMondayClient } from 'src/misc/auth'
import * as bp from '.botpress'

type CreateItem = bp.IntegrationProps['actions']['createItem']

export const createItem: CreateItem = async ({ input, ctx, client }) => {
  const mondayClient = await getMondayClient({ client, ctx })

  await mondayClient.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}
