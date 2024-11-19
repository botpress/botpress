import { createActionWrapper } from '@botpress/common'
import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Stream } from 'stream'
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
    const { id, url, mimeType } = input
    const { data } = await axios.get<Stream>(url, {
      responseType: 'stream',
    })
    await driveClient.uploadFileData({ id, mimeType, data })
    return {}
  }
)

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = wrapAction(
  { actionName: 'downloadFileData', errorMessage: 'Error downloading file' },
  async ({ client, driveClient, input }) => {
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
      const upsertResp = await client.upsertFile({
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
      const uploadResp = await client.uploadFile({
        ...uploadParams,
        content: data,
      })
      bpFileId = uploadResp.file.id
    }
    return { bpFileId }
  }
)

const syncChannels: bp.IntegrationProps['actions']['syncChannels'] = wrapAction(
  { actionName: 'syncChannels', errorMessage: 'Error syncing channels' },
  async ({ client, ctx, logger, driveClient }) => {
    const fileChannelsStore = await FileChannelsStore.load({ client, ctx, logger })
    const newChannels = await driveClient.watchAll()
    const oldChannels = await fileChannelsStore.setAll(newChannels)
    await fileChannelsStore.save()
    driveClient.unwatch(oldChannels)
    logger.forBot().debug(`Channels synced: ${newChannels.length} new channels, ${oldChannels.length} removed channels`)
    return {}
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
  syncChannels,
} as const satisfies bp.IntegrationProps['actions']
