import { NotionClient } from '../notion-api'
import * as types from '../notion-api/types'
import * as mapping from './mapping'

export const retrieveParentPath = async (
  parentObject: types.NotionItem['parent'],
  notionClient: NotionClient
): Promise<string> => {
  const parentPathFragments: string[] = []
  let currentParent = parentObject

  while (currentParent.type === 'database_id' || currentParent.type === 'page_id') {
    if (currentParent.type === 'database_id') {
      const db = await notionClient.getDatabase({ databaseId: currentParent.database_id })

      if (!db) {
        return '/'
      }

      parentPathFragments.unshift(mapping.getDatabaseTitle(db))
      currentParent = db.parent
      continue
    }

    const page = await notionClient.getPage({ pageId: currentParent.page_id })

    if (!page) {
      return '/'
    }

    parentPathFragments.unshift(mapping.getPageTitle(page))
    currentParent = page.parent
  }

  return `/${parentPathFragments.join('/')}`
}
