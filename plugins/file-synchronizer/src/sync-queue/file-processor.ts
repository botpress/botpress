import * as sdk from '@botpress/sdk'
import type * as models from '../../definitions/models'
import type * as types from '../types'

export type ProcessFileProps = {
  fileToSync: Readonly<types.SyncQueueItem>
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
}

export const processQueueFile = async (props: ProcessFileProps): Promise<types.SyncQueueItem> => {
  const fileToSync = structuredClone(props.fileToSync) as types.SyncQueueItem
  const existingFile = await _getExistingFileFromFilesApi(props, fileToSync)
  const shouldUploadFile = await _shouldUploadFile(props, fileToSync, existingFile)

  if (!shouldUploadFile) {
    fileToSync.status = 'already-synced'
    return fileToSync
  }

  fileToSync.status = 'newly-synced'

  await _deleteExistingFileFromFilesApi(props, existingFile)
  await _transferFileToBotpress(props, fileToSync)

  return fileToSync
}

const _getExistingFileFromFilesApi = async (
  props: ProcessFileProps,
  fileToSync: models.FileWithPath
): Promise<types.FilesApiFile | undefined> => {
  const { files: existingFiles } = await props.fileRepository.listFiles({
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
  props: ProcessFileProps,
  fileToSync: models.FileWithPath,
  existingFile?: types.FilesApiFile
) => {
  if (!existingFile) {
    props.logger.debug(`No existing file found. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  const newFileHasIdenticalContentHash =
    fileToSync.contentHash &&
    existingFile.tags.externalContentHash &&
    fileToSync.contentHash === existingFile.tags.externalContentHash

  if (newFileHasIdenticalContentHash) {
    props.logger.debug(`An identical file already exists in Botpress. Ignoring ${fileToSync.absolutePath} ...`)
    return false
  }

  const bothFilesHaveModifiedDate = fileToSync.lastModifiedDate && existingFile.tags.externalModifiedDate

  if (!bothFilesHaveModifiedDate) {
    // Not enough information to compare the files, so we always overwrite:
    props.logger.debug(`Not enough information to compare files. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  const newFileIsMoreRecent = new Date(fileToSync.lastModifiedDate!) > new Date(existingFile.tags.externalModifiedDate!)

  if (newFileIsMoreRecent) {
    props.logger.debug(`New file is more recent. Uploading ${fileToSync.absolutePath} ...`)
    return true
  }

  props.logger.debug(`Existing file is more recent or same date. Ignoring ${fileToSync.absolutePath} ...`)
  return false
}

const _deleteExistingFileFromFilesApi = async (props: ProcessFileProps, existingFile?: types.FilesApiFile) => {
  if (!existingFile) {
    return
  }

  try {
    await props.fileRepository.deleteFile({ id: existingFile.id })
  } catch {}
}

const _transferFileToBotpress = async (props: ProcessFileProps, fileToSync: types.SyncQueueItem) => {
  try {
    const { botpressFileId } = await props.integration.transferFileToBotpress({
      file: fileToSync,
      fileKey: `${props.integration.name}:${fileToSync.absolutePath}`,
      shouldIndex: fileToSync.shouldIndex,
    })

    await props.fileRepository.updateFileMetadata({
      id: botpressFileId,
      tags: {
        integrationName: props.integration.name,
        externalId: fileToSync.id,
        externalModifiedDate: fileToSync.lastModifiedDate ?? null,
        externalSize: fileToSync.sizeInBytes?.toString() ?? null,
        externalContentHash: fileToSync.contentHash ?? null,
        externalPath: fileToSync.absolutePath,
        externalParentId: fileToSync.parentId ?? null,
        ...(fileToSync.addToKbId !== undefined ? { kbId: fileToSync.addToKbId } : {}),
      },
    })
  } catch (thrown: unknown) {
    const err: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
    fileToSync.status = 'errored'
    fileToSync.errorMessage = err.message
    props.logger.error(`Error while uploading file ${fileToSync.absolutePath}: ${err.message}`)
  }
}
