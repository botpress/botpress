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
    alias: string
    transferFileToBotpress: (params: {
      file: models.FileWithPath
      fileKey: string
    }) => Promise<{ botpressFileId: string }>
  }
}

export const processQueueFile = async (props: ProcessFileProps): Promise<types.SyncQueueItem> => {
  const fileToSync = structuredClone(props.fileToSync) as types.SyncQueueItem
  const existingFile = await _getExistingFileFromFilesApi(props, fileToSync)
  const shouldUploadFile = _shouldUploadFile(props, fileToSync, existingFile)

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
      integrationName: props.integration.name,
      integrationAlias: props.integration.alias,
    },
  })

  if (existingFiles.length === 0) {
    return
  }

  return existingFiles[0]!
}

const _shouldUploadFile = (
  _props: ProcessFileProps,
  fileToSync: models.FileWithPath,
  existingFile?: types.FilesApiFile
) => {
  if (!existingFile) {
    return true
  }

  const existingHash = existingFile.tags['externalContentHash']
  const newHash = fileToSync.contentHash

  if (existingHash && newHash) {
    return existingHash !== newHash
  }

  const existingSize = existingFile.tags['externalSize']
  const newSize = fileToSync.sizeInBytes?.toString()

  if (existingSize && newSize) {
    return existingSize !== newSize
  }

  return true
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
      fileKey: `${props.integration.alias}:${fileToSync.absolutePath}`,
    })

    await props.fileRepository.updateFileMetadata({
      id: botpressFileId,
      tags: {
        integrationName: props.integration.name,
        integrationAlias: props.integration.alias,
        externalId: fileToSync.id,
        externalSize: fileToSync.sizeInBytes?.toString() ?? null,
        externalContentHash: fileToSync.contentHash ?? null,
        externalPath: fileToSync.absolutePath,
        ...(fileToSync.addToKbId !== undefined
          ? { kbId: fileToSync.addToKbId, source: 'knowledge-base', title: fileToSync.name, modalities: '["text"]' }
          : {}),
      },
    })
  } catch (thrown: unknown) {
    const err: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
    fileToSync.status = 'errored'
    fileToSync.errorMessage = err.message
    props.logger.error(`Error while uploading file ${fileToSync.absolutePath}: ${err.message}`)
  }
}
