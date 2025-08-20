import * as sdk from '@botpress/sdk'
import type * as models from '../../definitions/models'
import type * as types from '../types'
import { processQueueFile } from './file-processor'
import { findBatchEndCursor } from './queue-batching'

export type ProcessQueueProps = {
  syncQueue: Readonly<types.SyncQueue>
  logger: sdk.BotLogger
  fileRepository: {
    listFiles: (params: { tags: Record<string, string> }) => Promise<{ files: types.FilesApiFile[] }>
    deleteFile: (params: { id: string }) => Promise<unknown>
    updateFileMetadata: (params: { id: string; tags: Record<string, string | null> }) => Promise<unknown>
  }
  integration: {
    name: string
    transferFileToBotpress: (params: {
      file: models.FileWithPath
      fileKey: string
      shouldIndex: boolean
    }) => Promise<{ botpressFileId: string }>
  }
  updateSyncQueue: (props: { syncQueue: types.SyncQueue }) => Promise<unknown>
}

export const processQueue = async (props: ProcessQueueProps) => {
  // Short-circuit if the sync queue is empty:
  if (!props.syncQueue?.length) {
    props.logger.info('Sync queue is empty. Nothing to process.')
    return { finished: 'all' } as const
  }

  const syncQueue = structuredClone(props.syncQueue) as types.SyncQueue
  const startCursor = syncQueue.findIndex((file) => file.status === 'pending') ?? syncQueue.length - 1

  if (startCursor < 0) {
    props.logger.info('No files left to process in the sync queue.')
    return { finished: 'all' } as const
  }

  const { endCursor } = findBatchEndCursor({ startCursor, files: syncQueue })
  const filesInBatch = syncQueue.slice(startCursor, endCursor)

  for (const fileToSync of filesInBatch) {
    const processedFile = await processQueueFile({ ...props, fileToSync })
    Object.assign(fileToSync, processedFile)
  }

  await props.updateSyncQueue({ syncQueue })

  if (endCursor < syncQueue.length) {
    return { finished: 'batch' } as const
  }

  return { finished: 'all' } as const
}
