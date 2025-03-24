import * as picomatch from 'picomatch'
import type * as models from '../../definitions/models'
import { MAX_FILE_SIZE_BYTES } from '../consts'
import { randomUUID } from '../crypto'
import { updateSyncQueue } from '../job-file'
import type * as types from '../types'
import * as bp from '.botpress'

export const callAction: bp.AnyActionHandler = async (props) => {
  if (await _isSyncAlreadyInProgress(props)) {
    props.logger.info('Sync is already in progress. Ignoring sync event...')
    return { status: 'already-running' }
  }

  props.logger.info('Enumerating files...')
  const allFiles = await _enumerateAllFilesRecursive(props)

  props.logger.info('Preparing sync job...')
  const jobMeta = await _prepareSyncJob(props, allFiles)
  const jobFileId = await updateSyncQueue(props, jobMeta.syncFileKey, jobMeta.syncQueue, jobMeta.tags)

  props.logger.info('Starting sync job...')
  await props.workflows.processQueue.startNewInstance({
    input: { jobFileId },
    tags: jobMeta.tags,
  })

  return { status: 'queued' }
}

const _isSyncAlreadyInProgress = async (props: bp.ActionHandlerProps) => {
  const { workflows: runningWorkflows } = await props.workflows.processQueue.listInstances.running()

  return runningWorkflows.length > 0
}

const _enumerateAllFilesRecursive = async (
  props: bp.ActionHandlerProps,
  folderId?: string,
  path: string = '/'
): Promise<models.FileWithPath[]> => {
  const items = await _getFolderItems(props, folderId)
  const files: models.FileWithPath[] = []

  for (const item of items) {
    const itemPath = `${path}${item.name}`

    if (_shouldItemBeIgnored(props, item, itemPath)) {
      props.logger.debug('Ignoring item', { itemPath })
      continue
    }

    if (item.type === 'folder') {
      files.push(...(await _enumerateAllFilesRecursive(props, item.id, `${itemPath}/`)))
    } else {
      props.logger.debug('Including file', itemPath)
      files.push({ ...item, absolutePath: itemPath })
    }
  }

  return files
}

const _getFolderItems = async (props: bp.ActionHandlerProps, folderId?: string): Promise<models.FolderItem[]> => {
  let nextToken: string | undefined = undefined
  const items: models.FolderItem[] = []

  do {
    const { items: batchItems, meta } = await props.actions['files-readonly'].listItemsInFolder({
      folderId,
      nextToken,
    })

    items.push(...batchItems)
    nextToken = meta.nextToken
  } while (nextToken)

  return items
}

const _shouldItemBeIgnored = (
  { configuration }: bp.ActionHandlerProps,
  itemToSync: models.FolderItem,
  itemPath: string
) => {
  for (const { pathGlobPattern } of configuration.excludeFiles) {
    if (picomatch.isMatch(itemPath, pathGlobPattern)) {
      return true
    }
  }

  for (const { pathGlobPattern, maxSizeInBytes, modifiedAfter } of configuration.includeFiles) {
    if (!picomatch.isMatch(itemPath, pathGlobPattern)) {
      continue
    }

    const isFileWithUnmetRequirements =
      itemToSync.type === 'file' &&
      ((maxSizeInBytes &&
        itemToSync.sizeInBytes &&
        (itemToSync.sizeInBytes > maxSizeInBytes || itemToSync.sizeInBytes > MAX_FILE_SIZE_BYTES)) ||
        (modifiedAfter &&
          itemToSync.lastModifiedDate &&
          new Date(itemToSync.lastModifiedDate) < new Date(modifiedAfter)))

    return isFileWithUnmetRequirements
  }

  return true
}

const _prepareSyncJob = async (props: bp.ActionHandlerProps, filesToSync: models.FileWithPath[]) => {
  const integrationName = props.interfaces['files-readonly'].name
  const syncJobId = await randomUUID()

  return {
    tags: {
      syncJobId,
      syncType: 'manual',
      syncInitiatedAt: new Date().toISOString(),
    },
    syncQueue: filesToSync.map((file): types.SyncQueueItem => ({ ...file, status: 'pending' })) as types.SyncQueue,
    syncFileKey: `file-synchronizer:${integrationName}:/${syncJobId}.jsonl`,
  } as const
}
