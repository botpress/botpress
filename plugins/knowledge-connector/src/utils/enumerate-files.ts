import type * as sdk from '@botpress/sdk'

type ListItemsInFolder = (input: {
  folderId?: string
  nextToken?: string
  filters?: { itemType?: 'file' | 'folder' }
}) => Promise<{
  items: Array<
    | {
        id: string
        type: 'file'
        name: string
        parentId?: string
        absolutePath?: string
        sizeInBytes?: number
        lastModifiedDate?: string
        contentHash?: string
      }
    | {
        id: string
        type: 'folder'
        name: string
        parentId?: string
        absolutePath?: string
      }
  >
  meta: { nextToken?: string }
}>

export type EnumeratedFile = {
  id: string
  name: string
  absolutePath: string
  sizeInBytes?: number
  contentHash?: string
}

/**
 * Recursively enumerates all files within a given folder by traversing subfolders
 * and handling pagination via nextToken.
 */
export const enumerateFilesInFolder = async (props: {
  listItemsInFolder: ListItemsInFolder
  folderId: string
  folderPath: string
  logger: sdk.BotLogger
}): Promise<EnumeratedFile[]> => {
  const { listItemsInFolder, folderId, folderPath, logger } = props

  const files: EnumeratedFile[] = []
  const pendingFolders: Array<{ folderId?: string; absolutePath: string }> = [
    { folderId, absolutePath: folderPath },
  ]

  while (pendingFolders.length > 0) {
    const currentFolder = pendingFolders[0]!
    let nextToken: string | undefined

    do {
      const response = await listItemsInFolder({
        folderId: currentFolder.folderId,
        nextToken,
      })

      for (const item of response.items) {
        if (item.type === 'folder') {
          const subfolderPath = item.absolutePath ?? `${currentFolder.absolutePath}${item.name}/`
          pendingFolders.push({ folderId: item.id, absolutePath: subfolderPath })
        } else {
          const filePath = item.absolutePath ?? `${currentFolder.absolutePath}${item.name}`
          files.push({
            id: item.id,
            name: item.name,
            absolutePath: filePath,
            sizeInBytes: item.sizeInBytes,
            contentHash: item.contentHash,
          })
        }
      }

      nextToken = response.meta.nextToken
    } while (nextToken)

    pendingFolders.shift()
  }

  logger.info(`Enumerated ${files.length} files in folder "${folderPath}"`)
  return files
}
