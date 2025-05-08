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

  if (allFiles.length === 0) {
    props.logger.info('No files to sync.')
    return { status: 'queued' }
  }

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

type FileWithOptions = models.FileWithPath & { shouldIndex: boolean; addToKbId?: string }

const _enumerateAllFilesRecursive = async (
  props: bp.ActionHandlerProps,
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>,
  folderId?: string,
  path: string = '/'
): Promise<FileWithOptions[]> => {
  const items = await _getFolderItems(props, folderId)
  const files: FileWithOptions[] = []

  for (const item of items) {
    const itemPath = `${path}${item.name}`
    const globMatchResult = SyncQueue.globMatcher.matchItem({ configuration, item, itemPath })

    if (globMatchResult.shouldBeIgnored) {
      props.logger.debug('Ignoring item', { itemPath, reason: globMatchResult.reason })
      continue
    }

    if (item.type === 'folder') {
      files.push(...(await _enumerateAllFilesRecursive(props, configuration, item.id, `${itemPath}/`)))
    } else {
      props.logger.debug('Including file', itemPath)
      files.push({
        ...item,
        absolutePath: itemPath,
        shouldIndex: (globMatchResult.shouldApplyOptions.addToKbId?.length ?? 0) > 0,
        addToKbId: globMatchResult.shouldApplyOptions.addToKbId,
      })
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

const _prepareSyncJob = async (props: bp.ActionHandlerProps, filesToSync: FileWithOptions[]) => {
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
