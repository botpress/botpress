import { wrapAction } from '../../action-wrapper'
import * as mapping from '../mapping'

export const filesReadonlyListItemsInFolder = wrapAction(
  { actionName: 'filesReadonlyListItemsInFolder' },
  async ({ sharepointClient }, { folderId, filters, nextToken }) => {
    // Root: list all document libraries as folders
    if (!folderId) {
      const libs = await sharepointClient.listDocumentLibraries()
      const items = libs.map(mapping.mapLibrary)
      const filtered = applyFilters(items, filters)
      return { items: filtered, meta: { nextToken: undefined } }
    }

    // Subsequent pages: nextToken is the __next URL from a prior files call
    if (nextToken) {
      const { files, nextUrl } = await sharepointClient.listFiles(folderId, nextToken)
      const items = files.map((f) => mapping.mapFile(f, folderId))
      const filtered = applyFilters(items, filters)
      return { items: filtered, meta: { nextToken: nextUrl } }
    }

    // First page: fetch folders and first page of files in parallel
    const [subfolders, { files, nextUrl }] = await Promise.all([
      filters?.itemType === 'file' ? Promise.resolve([]) : sharepointClient.listSubfolders(folderId),
      filters?.itemType === 'folder'
        ? Promise.resolve({ files: [], nextUrl: undefined })
        : sharepointClient.listFiles(folderId),
    ])

    const folderItems = subfolders.map((f) => mapping.mapFolder(f, folderId))
    const fileItems = files.map((f) => mapping.mapFile(f, folderId))
    const items = [...folderItems, ...fileItems]
    const filtered = applyFilters(items, filters)

    return { items: filtered, meta: { nextToken: nextUrl } }
  }
)

type Item =
  | ReturnType<typeof mapping.mapFile>
  | ReturnType<typeof mapping.mapFolder>
  | ReturnType<typeof mapping.mapLibrary>
type Filters = { itemType?: 'file' | 'folder'; maxSizeInBytes?: number; modifiedAfter?: string } | undefined

function applyFilters(items: Item[], filters: Filters): Item[] {
  if (!filters) return items
  return items.filter((item) => {
    if (filters.itemType && item.type !== filters.itemType) return false
    if (item.type === 'file') {
      if (filters.maxSizeInBytes && item.sizeInBytes && item.sizeInBytes > filters.maxSizeInBytes) return false
      if (
        filters.modifiedAfter &&
        item.lastModifiedDate &&
        new Date(item.lastModifiedDate) < new Date(filters.modifiedAfter)
      ) {
        return false
      }
    }
    return true
  })
}
