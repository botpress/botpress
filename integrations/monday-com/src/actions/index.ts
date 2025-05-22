import { MondayClient } from 'src/misc/monday-client'
import { IntegrationProps } from '.botpress'

type CreateItem = IntegrationProps['actions']['createItem']

export const createItem: CreateItem = async ({ input, ctx }) => {
  const client = MondayClient.create({
    personalAccessToken: ctx.configuration.personalAccessToken,
  })

  await client.createItem(input.boardId, {
    name: input.itemName,
  })

  return {}
}
