import { Client as DriveClient } from './client'
import { wrapWithTryCatch } from './error-handling'
import * as bp from '.botpress'

const listFiles: bp.IntegrationProps['actions']['listFiles'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const { nextToken } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return await driveClient.listFiles(nextToken)
}, 'Error listing files')

const listFolders: bp.IntegrationProps['actions']['listFolders'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const { nextToken } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.listFolders(nextToken)
}, 'Error listing folders')

const createFile: bp.IntegrationProps['actions']['createFile'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.createFile(input)
}, 'Error creating file')

const readFile: bp.IntegrationProps['actions']['readFile'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const { id } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.readFile(id)
}, 'Error reading file')

const updateFile: bp.IntegrationProps['actions']['updateFile'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.updateFile(input)
}, 'Error updating file')

const deleteFile: bp.IntegrationProps['actions']['deleteFile'] = wrapWithTryCatch(async ({ client, ctx, input }) => {
  const { id } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  await driveClient.deleteFile(id)
  return {}
}, 'Error deleting file')

const uploadFileData: bp.IntegrationProps['actions']['uploadFileData'] = wrapWithTryCatch(
  async ({ client, ctx, input }) => {
    const driveClient = await DriveClient.client({
      client,
      ctx,
    })
    await driveClient.uploadFileData(input)
    return {}
  },
  'Error uploading file'
)

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = wrapWithTryCatch(
  async ({ client, ctx, input }) => {
    const driveClient = await DriveClient.client({
      client,
      ctx,
    })
    return driveClient.downloadFileData(input)
  },
  'Error downloading file'
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
