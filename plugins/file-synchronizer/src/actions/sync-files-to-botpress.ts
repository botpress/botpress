import type * as models from '../../definitions/models'
import { randomUUID } from '../crypto'
import * as SyncQueue from '../sync-queue'
import type * as types from '../types'
import * as bp from '.botpress'

export const callAction: bp.PluginHandlers['actionHandlers']['syncFilesToBotpess'] = async (props) => {
  if (await _isSyncAlreadyInProgress(props)) {
    props.logger.info('Sync is already in progress. Ignoring sync event...')
    return { status: 'already-running' }
  }

  props.logger.info('Enumerating files...')
  const allFiles = await _enumerateAllFilesRecursive(props, {
    includeFiles: props.input.includeFiles ?? props.configuration.includeFiles,
    excludeFiles: props.input.excludeFiles ?? props.configuration.excludeFiles,
  })

  props.logger.info('Preparing sync job...')
  const jobMeta = await _prepareSyncJob(props, allFiles)
  const jobFileId = await SyncQueue.jobFileManager.updateSyncQueue(
    props,
    jobMeta.syncFileKey,
    jobMeta.syncQueue,
    jobMeta.tags
  )

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
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>,
  folderId?: string,
  path: string = '/'
): Promise<models.FileWithPath[]> => {
  const items = await _getFolderItems(props, folderId)
  const files: models.FileWithPath[] = []

  for (const item of items) {
    const itemPath = `${path}${item.name}`

    if (SyncQueue.globMatcher.shouldItemBeIgnored({ configuration, item, itemPath })) {
      props.logger.debug('Ignoring item', { itemPath })
      continue
    }

    if (item.type === 'folder') {
      files.push(...(await _enumerateAllFilesRecursive(props, configuration, item.id, `${itemPath}/`)))
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
