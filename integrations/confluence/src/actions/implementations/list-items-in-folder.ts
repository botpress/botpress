import { ConfluenceClient } from 'src/client'
import * as bp from '.botpress'

import type { Actions } from '.botpress/implementation/typings/actions'

export const filesReadonlyListItemsInFolder: bp.IntegrationProps['actions']['filesReadonlyListItemsInFolder'] = async ({
  ctx,
}) => {
  const client = ConfluenceClient(ctx.configuration)
  const { items, token } = await client.getPages()

  const mappedItems = items.map((item): Actions['filesReadonlyListItemsInFolder']['output']['items'][number] => ({
    id: item.id ?? '0',
    type: 'file',
    name: item.title ?? 'Temporary title',
    parentId: item.parentId || undefined,
    absolutePath: item._links.webui || undefined,
    sizeInBytes: undefined,
    lastModifiedDate: item.version?.createdAt || undefined,
    contentHash: item.version?.number.toString() || undefined,
  }))

  return {
    items: mappedItems,
    meta: {
      nextToken: token,
    },
  }
}
