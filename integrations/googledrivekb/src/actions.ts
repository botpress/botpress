import { Client as DriveClient } from './client'
import { wrapWithTryCatch } from './error-handling'
import { FileChannelsCache } from './file-channels-cache'
import { FileEventHandler } from './file-event-handler'
import { downloadToBotpress } from './files-api-utils'
import { FilesCache } from './files-cache'
import { filesReadonlyActions } from './files-readonly/actions'
import * as bp from '.botpress'

type ActionPropsAndTools<T extends bp.AnyActionProps> = {
  driveClient: DriveClient
  filesCache: FilesCache
  fileChannelsCache: FileChannelsCache
  fileEventHandler: FileEventHandler
} & T

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

const readFile: bp.IntegrationProps['actions']['readFile'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const saveAllCachesAndReturnResult = makeSaveAllCachesAndReturnResult(props)
  return await driveClient.readFile(input.id).then(saveAllCachesAndReturnResult)
}, 'Error reading file')

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = wrapWithTryCatch(async (baseProps) => {
  const props = await createActionPropsAndTools(baseProps)
  const { driveClient, input } = props
  const { id, index } = input

  const { botpressFileId, botpressFileUrl } = await downloadToBotpress({
    botpressFileKey: id,
    googleDriveFileId: id,
    client: props.client,
    driveClient,
    indexFile: index,
  })

  await saveAllCaches(props)
  return { bpFileId: botpressFileId, url: botpressFileUrl }
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
  readFile,
  downloadFileData,
  syncChannels,

  ...filesReadonlyActions,
} as const satisfies bp.IntegrationProps['actions']
