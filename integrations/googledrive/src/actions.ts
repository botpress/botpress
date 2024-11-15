import { createActionWrapper } from '@botpress/common'
import { Client as DriveClient } from './client'
import { wrapWithTryCatch } from './error-handling'
import * as bp from '.botpress'

const injectToolsAndMetadata = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    driveClient: ({ client, ctx }) => DriveClient.create({ client, ctx }),
  },
  extraMetadata: {
    errorMessage: 'Placeholder error message',
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
} as const satisfies bp.IntegrationProps['actions']
