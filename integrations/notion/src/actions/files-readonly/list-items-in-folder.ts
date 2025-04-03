import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'
import * as mapping from '../../files-readonly/mapping'
import type { NotionClient } from '../../notion-api'
import * as bp from '.botpress'

export const filesReadonlyListItemsInFolder = wrapAction(
  { actionName: 'filesReadonlyListItemsInFolder', errorMessage: 'Failed to list items in folder' },
  async ({ notionClient }, { folderId, nextToken: prevToken }) => {
    if (!folderId) {
      return await _enumerateTopLevelItems({ notionClient, prevToken, folderId })
    } else if (folderId.startsWith(mapping.PREFIXES.PAGE_FOLDER)) {
      return await _enumeratePageAndChildItems({ folderId, notionClient, prevToken })
    } else if (folderId.startsWith(mapping.PREFIXES.DB_FOLDER)) {
      return await _enumerateDbChildItems({ folderId, notionClient, prevToken })
    }

    throw new sdk.RuntimeError(`Invalid folderId: ${folderId}`)
  }
)

type EnumerateItemsFn = (props: {
  folderId: string | undefined
  prevToken: string | undefined
  notionClient: NotionClient
}) => Promise<bp.actions.Actions['filesReadonlyListItemsInFolder']['output']>

const _enumerateTopLevelItems: EnumerateItemsFn = async ({ notionClient, prevToken }) => {
  const { nextToken, results } = await notionClient.enumerateTopLevelItems({ nextToken: prevToken })

  return { meta: { nextToken }, items: mapping.mapEntities(results) }
}

const _enumeratePageAndChildItems: EnumerateItemsFn = async ({ folderId, prevToken, notionClient }) => {
  const pageId = folderId!.slice(mapping.PREFIXES.PAGE_FOLDER.length)
  const { nextToken, results } = await notionClient.enumeratePageChildren({
    pageId,
    nextToken: prevToken,
  })

  const items = mapping.mapEntities(results)

  const page = await notionClient.getPage({ pageId })
  if (page) {
    items.push(mapping.mapPageToFile(page))
  }

  return { meta: { nextToken }, items }
}

const _enumerateDbChildItems: EnumerateItemsFn = async ({ folderId, prevToken, notionClient }) => {
  const dbId = folderId!.slice(mapping.PREFIXES.DB_FOLDER.length)
  const { nextToken, results } = await notionClient.enumerateDatabaseChildren({
    databaseId: dbId,
    nextToken: prevToken,
  })

  return { meta: { nextToken }, items: mapping.mapEntities(results) }
}
