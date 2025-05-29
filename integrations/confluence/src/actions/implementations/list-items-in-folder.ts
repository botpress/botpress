import { ConfluenceClient } from 'src/client'
import * as bp from '.botpress'

import type { Actions } from '.botpress/implementation/typings/actions'

export const filesReadonlyListItemsInFolder: bp.IntegrationProps['actions']['filesReadonlyListItemsInFolder'] = async ({
  ctx,
  input,
}) => {
  const client = ConfluenceClient(ctx.configuration)

  if (!input.folderId) {
    // Enumerate items in the root folder:
    const { items, token } = await client.getAllPagesRecursively(input.nextToken)

    const mappedItems = items.flatMap((item) =>
      item.parentId
        ? []
        : [
            {
              id: item.id ?? '0',
              type: 'folder',
              name: item.title ?? 'Temporary title',
            } satisfies Actions['filesReadonlyListItemsInFolder']['output']['items'][number],
          ]
    )

    return {
      items: mappedItems,
      meta: {
        nextToken: token,
      },
    }
  }

  // Else, enumerate a specific page and its children:

  const pageId = parseInt(input.folderId, 10)

  const mappedItems: Actions['filesReadonlyListItemsInFolder']['output']['items'] = []

  const { items: subPages, token } = await client.getPageDirectChildren({ pageId, nextToken: input.nextToken })

  mappedItems.push(
    ...subPages.map(
      (item) =>
        ({
          id: item.id ?? '0',
          type: 'folder',
          name: item.title ?? 'Temporary title',
        }) satisfies Actions['filesReadonlyListItemsInFolder']['output']['items'][number]
    )
  )

  if (!input.nextToken) {
    const item = await client.getPage({ pageId })
    mappedItems.push({
      id: item.id ?? '0',
      type: 'file',
      name: item.title ?? 'Temporary title',
      parentId: item.parentId ?? undefined,
      absolutePath: item._links.webui ?? undefined,
      sizeInBytes: undefined,
      lastModifiedDate: item.version?.createdAt,
      contentHash: item.version?.number.toString(),
    } satisfies Actions['filesReadonlyListItemsInFolder']['output']['items'][number])
  }

  return {
    items: mappedItems,
    meta: {
      nextToken: token,
    },
  }
}
