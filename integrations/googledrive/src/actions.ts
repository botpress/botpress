import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Stream } from 'stream'
import { Client as DriveClient } from './client'
import { wrapWithTryCatch } from './error-handling'
import { FileChannelsCache } from './file-channels-cache'
import { FileEventHandler } from './file-event-handler'
import { FilesCache } from './files-cache'
import * as bp from '.botpress'

type ActionPropsAndTools<T extends bp.AnyActionProps> = {
  driveClient: DriveClient
  filesCache: FilesCache
  fileChannelsCache: FileChannelsCache
  fileEventHandler: FileEventHandler
} & T

/**
 * @returns Base actions props and tools used by actions
 */
const createActionPropsAndTools = async <T extends bp.AnyActionProps>(props: T): Promise<ActionPropsAndTools<T>> => {
  const { client, ctx, logger } = props
  const driveClient = await DriveClient.create({ client, ctx, logger })
  const filesCache = await FilesCache.load({ client, ctx })
  const fileChannelsCache = await FileChannelsCache.load({ client, ctx })
  driveClient.setCache(filesCache)
  return {
    driveClient,
    filesCache,
    fileChannelsCache,
    fileEventHandler: new FileEventHandler(client, driveClient, filesCache, fileChannelsCache),
    ...props,
  }
}

const saveAllCaches = async <T extends bp.AnyActionProps>(props: ActionPropsAndTools<T>) => {
  await props.filesCache.save()
  await props.fileChannelsCache.save()
}

const makeSaveAllCachesAndReturnResult =
  <T extends bp.AnyActionProps>(props: ActionPropsAndTools<T>) =>
  async <R>(actionOutput: R) => {
    await saveAllCaches(props)
    return actionOutput
  }

const listFiles: bp.IntegrationProps['actions']['listFiles'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const saveAllCachesAndReturnResult = makeSaveAllCachesAndReturnResult(props)
  return await driveClient.listFiles(input).then(saveAllCachesAndReturnResult)
}, 'Error listing files')

const listFolders: bp.IntegrationProps['actions']['listFolders'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const saveAllCachesAndReturnResult = makeSaveAllCachesAndReturnResult(props)
  return await driveClient.listFolders(input).then(saveAllCachesAndReturnResult)
}, 'Error listing folders')

const createFile: bp.IntegrationProps['actions']['createFile'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input, fileEventHandler } = props
  const newFile = await driveClient.createFile(input)
  await fileEventHandler.handleFileCreated({ type: 'normal', ...newFile })
  await saveAllCaches(props)
  return newFile
}, 'Error creating file')

const readFile: bp.IntegrationProps['actions']['readFile'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const saveAllCachesAndReturnResult = makeSaveAllCachesAndReturnResult(props)
  return await driveClient.readFile(input.id).then(saveAllCachesAndReturnResult)
}, 'Error reading file')

const updateFile: bp.IntegrationProps['actions']['updateFile'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const saveAllCachesAndReturnResult = makeSaveAllCachesAndReturnResult(props)
  return await driveClient.updateFile(input).then(saveAllCachesAndReturnResult)
}, 'Error updating file')

const deleteFile: bp.IntegrationProps['actions']['deleteFile'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input, fileEventHandler } = props
  await driveClient.deleteFile(input.id)
  const oldFile = props.filesCache.find(input.id)
  if (oldFile) {
    await fileEventHandler.handleFileDeleted(oldFile)
  }
  await saveAllCaches(props)
  return {}
}, 'Error deleting file')

const uploadFileData: bp.IntegrationProps['actions']['uploadFileData'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const { id, url, mimeType } = input
  const { data } = await axios.get<Stream>(url, {
    responseType: 'stream',
  })
  await driveClient.uploadFileData({ id, mimeType, data })
  return {}
}, 'Error uploading file')

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const { id, index } = input
  const content = await driveClient.downloadFileData({ id })
  const { mimeType, dataSize, dataType, data } = content
  const uploadParams = {
    key: id,
    contentType: mimeType,
    index,
  }
  let bpFileId: string
  if (dataType === 'stream') {
    const upsertResp = await props.client.upsertFile({
      ...uploadParams,
      size: dataSize,
    })
    const { uploadUrl } = upsertResp.file
    bpFileId = upsertResp.file.id
    const headers = {
      'Content-Type': mimeType,
      'Content-Length': dataSize,
    }
    await axios
      .put(uploadUrl, data, {
        maxBodyLength: dataSize,
        headers,
      })
      .catch((reason: AxiosError) => {
        throw new RuntimeError(`Error uploading file stream to ${uploadUrl}: ${reason}`)
      })
  } else {
    const uploadResp = await props.client.uploadFile({
      ...uploadParams,
      content: data,
    })
    bpFileId = uploadResp.file.id
  }
  await saveAllCaches(props)
  return { bpFileId }
}, 'Error downloading file')

const syncChannels: bp.IntegrationProps['actions']['syncChannels'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, fileChannelsCache } = props
  const { fileChannels: newChannels } = await driveClient.tryWatchAll()
  const oldChannels = fileChannelsCache.setAll(newChannels)
  await fileChannelsCache.save()
  await driveClient.tryUnwatch(oldChannels)
  return {}
}, 'Error syncing channels')

export default {
  listFiles,
  listFolders,
  createFile,
  readFile,
  updateFile,
  deleteFile,
  uploadFileData,
  downloadFileData,
  syncChannels,
} as const satisfies bp.IntegrationProps['actions']
