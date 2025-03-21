import type * as models from '../../../definitions/models'
import { MAX_FILE_SIZE_BYTES } from '../../consts'
import { getSyncQueue, updateSyncQueue } from '../../job-file'
import type * as types from '../../types'
import * as bp from '.botpress'

type FilesApiFile = bp.ClientOutputs['getFile']['file']

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  const { syncQueue, key } = await getSyncQueue(props)
  const startCursor = syncQueue.findIndex((file) => file.status === 'pending') ?? syncQueue.length - 1
  const endCursor = _findBatchEndCursor(startCursor, syncQueue)
  const filesInBatch = syncQueue.slice(startCursor, endCursor)

  for (const fileToSync of filesInBatch) {
    const existingFile = await _getExistingFileFromFilesApi(props, fileToSync)
    const shouldUploadFile = await _shouldUploadFile(props, fileToSync, existingFile)

    if (!shouldUploadFile) {
      fileToSync.status = 'already-synced'
      continue
    }

    await _deleteExistingFileFromFilesApi(props, existingFile)
    await _transferFileToBotpress(props, fileToSync)
    fileToSync.status = 'newly-synced'
  }

  if (endCursor < syncQueue.length) {
    props.logger.info('Batch sync success. Continuing to next batch...')
    await updateSyncQueue(props, key, syncQueue)
    return
  }

  props.logger.info('Sync completed successfully')
  await updateSyncQueue(props, key, syncQueue)
  await props.workflow.setCompleted()
}

const _findBatchEndCursor = (startCursor: number, filesToSync: types.SyncQueue) => {
  const maxBatchSize = MAX_FILE_SIZE_BYTES

  let currentBatchSize = 0

  for (let newCursor = startCursor; newCursor < filesToSync.length; newCursor++) {
    const fileToSync = filesToSync[newCursor]!

    if (fileToSync.sizeInBytes === undefined) {
      continue
    }

    currentBatchSize += fileToSync.sizeInBytes

    if (currentBatchSize > maxBatchSize) {
      return newCursor
    }
  }

  return filesToSync.length
}

const _getExistingFileFromFilesApi = async (
  props: bp.WorkflowHandlerProps['processQueue'],
  fileToSync: models.FileWithPath
): Promise<FilesApiFile | undefined> => {
  const { files: existingFiles } = await props.client.listFiles({
    tags: {
      externalId: fileToSync.id,
    },
  })

  if (existingFiles.length === 0) {
    return
  }

  // Unfortunately, we cannot assume that there is only one file on Files API
  // with the same externalId, because there is no unique constraint on the tag.

  // However, the implementation would be more complicated if we take this into
  // account, so we will naively assume that we have full control over the
  // externalId tag and that it is unique. If users go out of their way to use
  // the API to create files with the same externalId, we will not be able to
  // handle this case correctly.

  return existingFiles[0]!
}

const _shouldUploadFile = async (
  props: bp.WorkflowHandlerProps['processQueue'],
  fileToSync: models.FileWithPath,
  existingFile?: FilesApiFile
) => {
  const logger = props.logger.withWorkflowId(props.workflow.id) // TODO: inject workflow id directly in the sdk

  if (!existingFile) {
    logger.debug(`No existing file found. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  const newFileHasIdenticalContentHash =
    fileToSync.contentHash &&
    existingFile.tags.externalContentHash &&
    fileToSync.contentHash === existingFile.tags.externalContentHash

  if (newFileHasIdenticalContentHash) {
    logger.debug(`An identical file already exists in Botpress. Ignoring ${fileToSync.absolutePath} ...`)
    return false
  }

  const bothFilesHaveModifiedDate = fileToSync.lastModifiedDate && existingFile.tags.externalModifiedDate

  if (!bothFilesHaveModifiedDate) {
    // Not enough information to compare the files, so we always overwrite:
    logger.debug(`Not enough information to compare files. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  const newFileIsMoreRecent = new Date(fileToSync.lastModifiedDate!) > new Date(existingFile.tags.externalModifiedDate!)

  if (newFileIsMoreRecent) {
    logger.debug(`New file is more recent. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  logger.debug(`Existing file is more recent or same date. Ignoring ${fileToSync.absolutePath} ...`)
  return false
}

const _deleteExistingFileFromFilesApi = async (
  props: bp.WorkflowHandlerProps['processQueue'],
  existingFile?: FilesApiFile
) => {
  if (!existingFile) {
    return
  }

  try {
    await props.client.deleteFile({ id: existingFile.id })
  } catch {}
}

const _transferFileToBotpress = async (
  props: bp.WorkflowHandlerProps['processQueue'],
  fileToSync: models.FileWithPath
) => {
  const { botpressFileId } = await props.actions['files-readonly'].transferFileToBotpress({
    file: fileToSync,
    fileKey: `${props.interfaces['files-readonly'].name}:${fileToSync.absolutePath}`,
  })

  await props.client.updateFileMetadata({
    id: botpressFileId,
    metadata: {
      workflow: props.workflow.id,
      syncJobId: props.workflow.tags.syncJobId,
      syncInitiatedAt: props.workflow.tags.syncInitiatedAt,
      syncType: props.workflow.tags.syncType,
      integrationName: props.interfaces['files-readonly'].name,
    },
    tags: {
      externalId: fileToSync.id,
      externalModifiedDate: fileToSync.lastModifiedDate ?? null,
      externalSize: fileToSync.sizeInBytes?.toString() ?? null,
      externalContentHash: fileToSync.contentHash ?? null,
    },
  })
}
