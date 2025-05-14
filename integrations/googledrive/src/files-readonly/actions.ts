import { downloadToBotpress } from 'src/files-api-utils'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from 'src/mime-types'
import { Client as DriveClient } from '../client'
import * as bp from '.botpress'

export const filesReadonlyActions = {
  async filesReadonlyListItemsInFolder(props) {
    const driveClient = await DriveClient.create(props)
    const query: string[] = []

    if (props.input.filters?.itemType === 'file') {
      query.push(`mimeType != '${APP_GOOGLE_FOLDER_MIMETYPE}'`, `mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`)
    } else if (props.input.filters?.itemType === 'folder') {
      query.push(`mimeType = '${APP_GOOGLE_FOLDER_MIMETYPE}'`)
    } else {
      query.push(`mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}''`)
    }

    if (props.input.filters?.maxSizeInBytes) {
      query.push(`size <= ${props.input.filters.maxSizeInBytes}`)
    }

    if (props.input.filters?.modifiedAfter) {
      query.push(`modifiedTime > '${props.input.filters.modifiedAfter}'`)
    }

    const parentId = props.input.folderId ?? 'root'
    const { files, nextToken: newNextToken } = await driveClient.getChildrenSubset({
      folderId: parentId,
      extraQuery: query.join(' and '),
      nextToken: props.input.nextToken,
    })

    const mappedItems = files
      .filter((item) => item.type !== 'shortcut')
      .map((item) => ({
        id: item.id,
        name: item.name,
        parentId,
        ...(item.type === 'normal'
          ? {
              type: 'file' as const,
              sizeInBytes: item.size,
              contentHash: item.contentHash,
              lastModifiedDate: item.lastModifiedDate,
            }
          : {
              type: 'folder' as const,
            }),
      }))

    return { items: mappedItems, meta: { nextToken: newNextToken } }
  },

  async filesReadonlyTransferFileToBotpress(props) {
    const driveClient = await DriveClient.create(props)

    const { botpressFileId } = await downloadToBotpress({
      botpressFileKey: props.input.fileKey,
      googleDriveFileId: props.input.file.id,
      client: props.client,
      driveClient,
      indexFile: props.input.shouldIndex,
    })

    return { botpressFileId }
  },
} as const satisfies Pick<
  bp.IntegrationProps['actions'],
  'filesReadonlyListItemsInFolder' | 'filesReadonlyTransferFileToBotpress'
>
