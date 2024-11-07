import { Client as DriveClient } from './client'
import * as bp from '.botpress'

const listFiles: bp.IntegrationProps['actions']['listFiles'] = async (props) => {
  const { client, ctx, input } = props
  const { nextToken } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return await driveClient.listFiles(nextToken)
}

const listFolders: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const { client, ctx, input } = props
  const { nextToken } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.listFolders(nextToken)
}

const createFile: bp.IntegrationProps['actions']['createFile'] = async (props) => {
  const { client, ctx, input } = props
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.createFile(input)
}

const readFile: bp.IntegrationProps['actions']['readFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.readFile(id)
}

const updateFile: bp.IntegrationProps['actions']['updateFile'] = async (props) => {
  const { client, ctx, input } = props
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.updateFile(input)
}

const deleteFile: bp.IntegrationProps['actions']['deleteFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id } = input
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  await driveClient.deleteFile(id)
  return {}
}

const uploadFileData: bp.IntegrationProps['actions']['uploadFileData'] = async (props) => {
  const { client, ctx, input } = props
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  await driveClient.uploadFileData(input)
  return {}
}

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = async (props) => {
  const { client, ctx, input } = props
  const driveClient = await DriveClient.client({
    client,
    ctx,
  })
  return driveClient.downloadFileData(input)
}

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
