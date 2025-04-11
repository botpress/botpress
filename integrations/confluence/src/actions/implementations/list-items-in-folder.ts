import { wrapAction } from '../wrapper'
import { getConfluencePages } from './get-all-pages'

import type { Actions } from '.botpress/implementation/typings/actions'

export const filesReadonlyListItemsInFolder = wrapAction(
  { actionName: 'filesReadonlyListItemsInFolder', errorMessage: 'Failed to list items' },
  async () => {
    const { items, token } = await getConfluencePages()

    const mappedItems = items.map((item): Actions['filesReadonlyListItemsInFolder']['output']['items'][number] => {
      return {
        id: item.id,
        type: 'file',
        name: item.title,
        parentId: item.parentId || undefined,
        absolutePath: item._links.webui || undefined,
        sizeInBytes: undefined,
        lastModifiedDate: item.version.createdAt || undefined,
        contentHash: undefined,
      }
    })

    const values: Actions['filesReadonlyListItemsInFolder']['output'] = {
      items: mappedItems,
      meta: {
        nextToken: token,
      },
    }

    return values
  }
)
