import * as sdk from '@botpress/sdk'
import { File as FileEntity, Folder as FolderEntity, Deleted as DeletedEntity } from '../../../definitions'
import { DropboxClient } from '../../dropbox-api'
import { FileTree, type FileTreeDiff } from '../../dropbox-api/file-tree'
import * as filesReadonlyMapping from '../../files-readonly/mapping'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = sdk.z.object({
  list_folder: sdk.z.object({
    accounts: sdk.z.array(sdk.z.string()),
  }),
})

export const isFileChangeNotification = (props: bp.HandlerProps) =>
  props.req.method.toUpperCase() === 'POST' &&
  props.req.body &&
  NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success

export const handleFileChangeEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)
  const dropboxClient = await DropboxClient.create(props)
  const accountId = dropboxClient.getAccountId()

  if (!payload.list_folder.accounts.includes(accountId)) {
    // If the account ID is not in the list of accounts, we can ignore this notification
    return
  }

  const { syncCursor: prevSyncCursor, fileTree } = await _getSyncState(props)

  const { newSyncCursor } = await _collectChangesAndBroadcast(props, prevSyncCursor, fileTree)
  await _updateSyncState(props, newSyncCursor, fileTree)
}

const _getSyncState = async (props: bp.HandlerProps): Promise<{ syncCursor?: string; fileTree: FileTree }> => {
  const { state } = await props.client.getOrSetState({
    id: props.ctx.integrationId,
    type: 'integration',
    name: 'realTimeSync',
    payload: {
      syncCursor: '',
      fileTreeJson: '[]',
    },
  })

  return { syncCursor: state.payload.syncCursor || undefined, fileTree: FileTree.fromJSON(state.payload.fileTreeJson) }
}

const _updateSyncState = async (props: bp.HandlerProps, syncCursor: string, fileTree: FileTree) => {
  await props.client.setState({
    id: props.ctx.integrationId,
    type: 'integration',
    name: 'realTimeSync',
    payload: {
      syncCursor,
      fileTreeJson: fileTree.toJSON(),
    },
  })
}

const _collectChangesAndBroadcast = async (
  props: bp.HandlerProps,
  prevSyncCursor: string | undefined,
  fileTree: FileTree
) => {
  const { items: modifiedItems, newSyncCursor } = await _getModifiedItems(props, prevSyncCursor)

  // TODO: if this is the first sync (prevSyncCursor is undefined), ignore files modified before the integration's register()

  const diff = fileTree.pushItems(modifiedItems)

  await _broadcastChanges(props, {
    deleted: diff.deleted,
    updated: diff.updated.filter((item) => item.itemType === 'file'),
    added: diff.added.filter((item) => item.itemType === 'file'),
  })

  return { newSyncCursor }
}

const _getModifiedItems = async (props: bp.HandlerProps, prevSyncCursor: string | undefined) => {
  const dropboxClient = await DropboxClient.create(props)

  let currentSyncCursor: string | undefined = prevSyncCursor
  let hasMore: boolean = false
  const items: (FileEntity.InferredType | FolderEntity.InferredType | DeletedEntity.InferredType)[] = []
  do {
    const itemBatch = await dropboxClient.listItemsInFolder({ path: '', recursive: true, nextToken: currentSyncCursor })
    items.push(...itemBatch.items)
    currentSyncCursor = itemBatch.nextToken
    hasMore = itemBatch.hasMore
  } while (hasMore)

  return {
    newSyncCursor: currentSyncCursor,
    items,
  }
}

const _broadcastChanges = async (props: bp.HandlerProps, fileTreeDiff: FileTreeDiff) => {
  for (const diffBatch of _getDiffBatches(fileTreeDiff)) {
    await props.client.createEvent({
      type: 'aggregateFileChanges',
      payload: {
        modifiedItems: {
          created: (diffBatch.added as FileEntity.InferredType[]).map(filesReadonlyMapping.mapFile),
          updated: (diffBatch.updated as FileEntity.InferredType[]).map(filesReadonlyMapping.mapFile),
          deleted: diffBatch.deleted.map((item) =>
            item.itemType === 'file' ? filesReadonlyMapping.mapFile(item) : filesReadonlyMapping.mapFolder(item)
          ),
        },
      },
    })
  }
}

const _getDiffBatches = function* ({ added, updated, deleted }: FileTreeDiff) {
  const MAX_BATCH_SIZE = 50

  let addedCursor = 0
  let updatedCursor = 0
  let deletedCursor = 0

  // Continue until all arrays are exhausted:
  while (addedCursor < added.length || updatedCursor < updated.length || deletedCursor < deleted.length) {
    const currentBatch: FileTreeDiff = { added: [], deleted: [], updated: [] }

    for (let currentBatchSize = 0; currentBatchSize < MAX_BATCH_SIZE; ) {
      const startSize = currentBatchSize

      if (addedCursor < added.length && currentBatchSize < MAX_BATCH_SIZE) {
        currentBatch.added.push(added[addedCursor++]!)
        currentBatchSize++
      }

      if (updatedCursor < updated.length && currentBatchSize < MAX_BATCH_SIZE) {
        currentBatch.updated.push(updated[updatedCursor++]!)
        currentBatchSize++
      }

      if (deletedCursor < deleted.length && currentBatchSize < MAX_BATCH_SIZE) {
        currentBatch.deleted.push(deleted[deletedCursor++]!)
        currentBatchSize++
      }

      // If no item was added, the array is exhausted:
      if (currentBatchSize === startSize) {
        break
      }
    }

    yield currentBatch
  }
}
