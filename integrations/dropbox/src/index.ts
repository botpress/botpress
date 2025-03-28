import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { File as FileEntity, Folder as FolderEntity } from '../definitions'
import { wrapAction } from './action-wrapper'
import * as filesReadonlyMapping from './files-readonly/mapping'
import { register, unregister } from './setup'
import * as webhookEvents from './webhook-events'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,

  actions: {
    createFile: wrapAction({ actionName: 'createFile' }, async ({ dropboxClient }, { contents, path }) => ({
      newFile: await dropboxClient.createFileFromText({ dropboxPath: path, textContents: contents }),
    })),
    listItemsInFolder: wrapAction(
      { actionName: 'listItemsInFolder' },
      ({ dropboxClient }, { path, recursive, nextToken }) =>
        dropboxClient
          .listItemsInFolder({ path: path ?? '', recursive: recursive ?? false, nextToken })
          .then(({ items, nextToken, hasMore }) => ({
            items: items.filter((it) => it.itemType !== 'deleted'),
            nextToken: hasMore ? nextToken : undefined,
          }))
    ),
    deleteItem: wrapAction({ actionName: 'deleteItem' }, ({ dropboxClient }, { path }) =>
      dropboxClient.deleteItem({ path })
    ),
    downloadFile: wrapAction({ actionName: 'downloadFile' }, async ({ dropboxClient, client }, { path }) => {
      const fileBuffer = await dropboxClient.getFileContents({ path })

      const file = await client.uploadFile({
        key: `dropbox:${path}`,
        content: fileBuffer,
      })

      return { fileUrl: file.file.url }
    }),
    downloadFolder: wrapAction({ actionName: 'downloadFolder' }, async ({ dropboxClient, client }, { path }) => {
      const folderZipBuffer = await dropboxClient.downloadFolder({ path })

      const file = await client.uploadFile({
        key: `dropbox:${path}.zip`,
        content: folderZipBuffer,
      })

      return { zipUrl: file.file.url }
    }),
    createFolder: wrapAction({ actionName: 'createFolder' }, async ({ dropboxClient }, { path }) => ({
      newFolder: await dropboxClient.createFolder({ path }),
    })),
    copyItem: wrapAction({ actionName: 'copyItem' }, async ({ dropboxClient }, { fromPath, toPath }) => ({
      newItem: (await dropboxClient.copyItemToNewPath({ fromPath, toPath })) as
        | FileEntity.InferredType
        | FolderEntity.InferredType,
    })),
    moveItem: wrapAction({ actionName: 'moveItem' }, async ({ dropboxClient }, { fromPath, toPath }) => ({
      newItem: (await dropboxClient.moveItemToNewPath({ fromPath, toPath })) as
        | FileEntity.InferredType
        | FolderEntity.InferredType,
    })),
    searchItems: wrapAction(
      { actionName: 'searchItems' },
      async ({ dropboxClient }, searchParams) =>
        await dropboxClient.searchItems(searchParams).then(({ nextToken, results }) => ({
          nextToken,
          results: results
            .filter(({ item }) => item.itemType !== 'deleted')
            .map(({ item, matchType }) => ({
              item: item as FileEntity.InferredType | FolderEntity.InferredType,
              matchType,
            })),
        }))
    ),

    filesReadonlyTransferFileToBotpress: wrapAction(
      { actionName: 'filesReadonlyTransferFileToBotpress' },
      async ({ dropboxClient, client }, { file: fileToTransfer, fileKey }) => {
        const fileBuffer = await dropboxClient.getFileContents({ path: fileToTransfer.id })

        const { file: uploadedFile } = await client.uploadFile({
          key: fileKey,
          content: fileBuffer,
        })

        return { botpressFileId: uploadedFile.id }
      }
    ),
    filesReadonlyListItemsInFolder: wrapAction(
      { actionName: 'filesReadonlyListItemsInFolder' },
      async ({ dropboxClient }, { folderId, filters, nextToken: prevToken }) => {
        const parentId = folderId ?? ''
        const { items, nextToken, hasMore } = await dropboxClient.listItemsInFolder({
          path: parentId,
          recursive: false,
          nextToken: prevToken,
        })

        const mappedAndFilteredItems = items
          .filter((item) => item.itemType !== 'deleted')
          .map((item) =>
            item.itemType === 'file' ? filesReadonlyMapping.mapFile(item) : filesReadonlyMapping.mapFolder(item)
          )
          .filter(
            (item) =>
              !(
                (filters?.itemType && item.type !== filters.itemType) ||
                (filters?.maxSizeInBytes &&
                  item.type === 'file' &&
                  item.sizeInBytes &&
                  item.sizeInBytes > filters.maxSizeInBytes) ||
                (filters?.modifiedAfter &&
                  item.type === 'file' &&
                  item.lastModifiedDate &&
                  new Date(item.lastModifiedDate) < new Date(filters.modifiedAfter))
              )
          )

        return {
          items: mappedAndFilteredItems,
          meta: { nextToken: hasMore ? nextToken : undefined },
        }
      }
    ),
  },

  handler: webhookEvents.handler,

  channels: {},
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
