import { createActionWrapper } from '@botpress/common'
import { Client as DriveClient } from './client'
import { wrapWithTryCatch } from './error-handling'
import { FileChannelsStore } from './file-channels-store'
import * as bp from '.botpress'

const injectToolsAndMetadata = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    driveClient: ({ client, ctx, logger }) => DriveClient.create({ client, ctx, logger }),
  },
  extraMetadata: {
    errorMessage: 'Placeholder error message', // TODO: Specify extraMetadata shape instead of providing placeholder values?
  },
})

const wrapAction: typeof injectToolsAndMetadata = (meta, actionImpl) =>
  injectToolsAndMetadata(meta, (props) =>
    wrapWithTryCatch(() => {
      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input) //TODO: Find way to remove cast?
    }, `Action Error: ${meta.errorMessage}`)()
  )

const listFiles: bp.IntegrationProps['actions']['listFiles'] = wrapAction(
  { actionName: 'listFiles', errorMessage: 'Error listing files' },
  async ({ driveClient, input }) => {
    return await driveClient.listFiles(input)
  }
)

const listFolders: bp.IntegrationProps['actions']['listFolders'] = wrapAction(
  { actionName: 'listFolders', errorMessage: 'Error listing folders' },
  async ({ driveClient, input }) => {
    return await driveClient.listFolders(input)
  }
)

const createFile: bp.IntegrationProps['actions']['createFile'] = wrapAction(
  { actionName: 'createFile', errorMessage: 'Error creating file' },
  async ({ driveClient, input }) => {
    return await driveClient.createFile(input)
  }
)

const readFile: bp.IntegrationProps['actions']['readFile'] = wrapAction(
  { actionName: 'readFile', errorMessage: 'Error reading file' },
  async ({ driveClient, input }) => {
    return await driveClient.readFile(input.id)
  }
)

const updateFile: bp.IntegrationProps['actions']['updateFile'] = wrapAction(
  { actionName: 'updateFile', errorMessage: 'Error updating file' },
  async ({ driveClient, input }) => {
    return await driveClient.updateFile(input)
  }
)

const deleteFile: bp.IntegrationProps['actions']['deleteFile'] = wrapAction(
  { actionName: 'deleteFile', errorMessage: 'Error deleting file' },
  async ({ driveClient, input }) => {
    await driveClient.deleteFile(input.id)
    return {}
  }
)

const uploadFileData: bp.IntegrationProps['actions']['uploadFileData'] = wrapAction(
  { actionName: 'uploadFileData', errorMessage: 'Error uploading file' },
  async ({ driveClient, input }) => {
    await driveClient.uploadFileData(input)
    return {}
  }
)

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = wrapAction(
  { actionName: 'downloadFileData', errorMessage: 'Error downloading file' },
  async ({ driveClient, input }) => {
    return await driveClient.downloadFileData(input)
  }
)

const syncFiles: bp.IntegrationProps['actions']['syncFiles'] = wrapAction(
  { actionName: 'syncFiles', errorMessage: 'Error syncing files' },
  async ({ client, ctx, logger, driveClient }) => {
    // TODO: Decide on a common way to handle stores and caches (inside or outside client, load/save/invalidation)
    // TODO: If possible, unify file cache and file channels store to keep a unique source of truth for known files
    const fileChannelsStore = await FileChannelsStore.load({ client, ctx, logger })
    const channels = await driveClient.watchAll()
    const { newChannels, deletedChannels } = await fileChannelsStore.setAll(channels)
    await fileChannelsStore.save()
    driveClient.unwatch(deletedChannels)
    const newFilesIds = newChannels.map((channel) => channel.fileId) // TODO: Keep normal files only
    const deletedFilesIds = deletedChannels.map((channel) => channel.fileId) // TODO: Keep normal files only
    const updatedFilesIds: string[] = [] // TODO: Base update status on metadata or content change
    return { newFilesIds, deletedFilesIds, updatedFilesIds }
  }
)

export default {
  listFiles,
  listFolders,
  createFile,
  readFile,
  updateFile,
  deleteFile,
  uploadFileData,
  downloadFileData,
  syncFiles,
} as const satisfies bp.IntegrationProps['actions']
