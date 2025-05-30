import * as sdk from '@botpress/sdk'
import { ConfluenceClient } from 'src/client'
import * as bp from '.botpress'

import type { Actions } from '.botpress/implementation/typings/actions'

type FilesReadonlyItem = Actions['filesReadonlyListItemsInFolder']['output']['items'][number]

const PAGE_ENTITY = 'page'
const SPACE_ENTITY = 'space'
const PREFIX_SEPARATOR = ':'
const SPACE_PREFIX = `${SPACE_ENTITY}${PREFIX_SEPARATOR}`
const PAGE_PREFIX = `${PAGE_ENTITY}${PREFIX_SEPARATOR}`
type EntityType = 'space' | 'folder' | 'page' | 'database' | 'embed' | 'whiteboard'

export const filesReadonlyListItemsInFolder: bp.IntegrationProps['actions']['filesReadonlyListItemsInFolder'] = async ({
  ctx,
  input,
}) => {
  const client = ConfluenceClient(ctx.configuration)

  if (!input.folderId) {
    // Enumerate spaces:
    const { items, token } = await client.getAllSpaces({ nextToken: input.nextToken })

    const mappedItems = items.map(
      (item) =>
        ({
          id: `${SPACE_PREFIX}${item.id}`,
          type: 'folder',
          name: item.name,
        }) satisfies FilesReadonlyItem
    )

    return {
      items: mappedItems,
      meta: {
        nextToken: token,
      },
    }
  }

  // Else, enumerate a specific entity and its children:

  const [entityType_, entityId_] = input.folderId.split(PREFIX_SEPARATOR)

  if (!entityType_ || !entityId_) {
    throw new sdk.RuntimeError('Invalid folderId format')
  }

  const entityId = parseInt(entityId_, 10)
  const entityType = entityType_ as EntityType

  const mappedItems: FilesReadonlyItem[] = []
  let nextToken: string | undefined

  switch (entityType) {
    case 'space':
      const space = await client.getSpace({ spaceId: entityId })
      const homePage = await client.getPage({ pageId: parseInt(space.homepageId, 10) })

      mappedItems.push({
        id: `${PAGE_PREFIX}${homePage.id}`,
        type: 'folder',
        name: homePage.title ?? 'Temporary title',
        parentId: homePage.parentId ?? undefined,
        absolutePath: homePage._links.webui ?? undefined,
      } satisfies FilesReadonlyItem)
      break

    case 'database':
    case 'embed':
    case 'whiteboard':
    case 'folder':
      const { items: children, token: entityNextToken } = await client.getDirectChildren({
        entityId,
        entityType,
        nextToken: input.nextToken,
      })

      mappedItems.push(
        ...children.map(
          (item) =>
            ({
              id: `${item.type}${PREFIX_SEPARATOR}${item.id ?? '0'}`,
              type: 'folder',
              name: item.title ?? 'Temporary title',
            }) satisfies FilesReadonlyItem
        )
      )

      nextToken = entityNextToken
      break

    case 'page':
      if (!input.nextToken) {
        const item = await client.getPage({ pageId: entityId })
        mappedItems.push({
          id: item.id ?? '0',
          type: 'file',
          name: 'page.md',
          parentId: item.parentId ?? undefined,
          absolutePath: item._links.webui ?? undefined,
          sizeInBytes: undefined,
          lastModifiedDate: item.version?.createdAt,
          contentHash: item.version?.number.toString(),
        } satisfies FilesReadonlyItem)
      }

      const { items: subPages, token: pageNextToken } = await client.getDirectChildren({
        entityId,
        entityType,
        nextToken: input.nextToken,
      })
      mappedItems.push(
        ...subPages.map(
          (item) =>
            ({
              id: `${item.type}${PREFIX_SEPARATOR}${item.id ?? '0'}`,
              type: 'folder',
              name: item.title ?? 'Temporary title',
            }) satisfies FilesReadonlyItem
        )
      )
      nextToken = pageNextToken
      break

    default:
      entityType satisfies never
  }

  return {
    items: mappedItems,
    meta: {
      nextToken,
    },
  } satisfies { items: FilesReadonlyItem[]; meta: { nextToken?: string } }
}
