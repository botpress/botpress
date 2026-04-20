import { NotionClient } from '../notion-api'
import * as types from '../notion-api/types'
import * as mapping from './mapping'

export const retrieveParentPath = async (
  parentObject: types.NotionItem['parent'],
  notionClient: NotionClient
): Promise<string> => {
  const parentPathFragments: string[] = []
  let currentParent = parentObject

  while (
    currentParent.type === 'database_id' ||
    currentParent.type === 'data_source_id' ||
    currentParent.type === 'page_id'
  ) {
    if (currentParent.type === 'database_id' || currentParent.type === 'data_source_id') {
      const dataSourceId =
        currentParent.type === 'database_id' ? currentParent.database_id : currentParent.data_source_id
      const ds = await notionClient.getDataSource({ dataSourceId })

      if (!ds) {
        return '/'
      }

      parentPathFragments.unshift(mapping.getDataSourceTitle(ds))
      currentParent = ds.parent
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
