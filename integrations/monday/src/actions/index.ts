import { getAccessToken } from 'src/misc/auth'
import { MondayClient } from 'src/misc/monday-client'
import * as bp from '.botpress'

type CreateItem = bp.IntegrationProps['actions']['createItem']

export const createItem: CreateItem = async ({ input, ctx, client }) => {
  const accessToken = await getAccessToken({ client, ctx })

  const mondayClient = MondayClient.create({
    personalAccessToken: accessToken,
  })

  await mondayClient.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}
