import { RuntimeError } from '@botpress/client'
import { getClient } from './client'
import { GoogleDriveClient, GoogleDriveFile, UnvalidatedGoogleDriveFile } from './types'
import * as bp from '.botpress'

const PAGE_SIZE = 10

type FilesMap = Record<string, GoogleDriveFile>

const listFiles: bp.IntegrationProps['actions']['listFiles'] = async ({ client, ctx, input }) => {
  if (!input.nextToken) {
    // Invalidate the known files map if starting from the beginning
    await setKnownFilesMap({}, client, ctx)
  }

  const filesMap = await getKnownFilesMap(client, ctx)

  // TODO: Support shared drives
  const googleClient = await getClient({ client, ctx })
  const listResponse = await googleClient.files.list({
    corpora: 'user', // TODO: Limit to the configured drive if optional driveId is provided
    fields: 'files(id, name, mimeType, parents), nextPageToken',
    pageToken: input.nextToken,
    pageSize: PAGE_SIZE,
  })

  const nextToken = listResponse.data.nextPageToken ?? undefined
  const unvalidatedDriveFiles = listResponse.data.files
  if (!unvalidatedDriveFiles) {
    throw new RuntimeError('No files were returned by the API')
  }
  const driveFiles = validateDriveFiles(unvalidatedDriveFiles)

  driveFiles.forEach((driveFile) => {
    filesMap[driveFile.id] = driveFile
  })

  const nonFolderDriveFiles = driveFiles.filter((f) => !isFolder(f))
  for (const nonFolderDriveFile of nonFolderDriveFiles) {
    await addParentsToKnownFiles(nonFolderDriveFile, filesMap, googleClient)
  }
  await setKnownFilesMap(filesMap, client, ctx)

  const items = nonFolderDriveFiles.map((file) => ({
    id: file.id,
    name: getFilePath(file, filesMap),
  }))

  return {
    items,
    meta: {
      nextToken,
    },
  }
}

const setKnownFilesMap = async (knownFilesMap: FilesMap, client: bp.Client, ctx: bp.Context) => {
  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      knownFilesMapJson: JSON.stringify(knownFilesMap),
    },
  })
}

const getKnownFilesMap = async (client: bp.Client, ctx: bp.Context): Promise<FilesMap> => {
  const getStateResponse = await client.getOrSetState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      knownFilesMapJson: JSON.stringify({}),
    },
  })
  const map: FilesMap = JSON.parse(getStateResponse.state.payload.knownFilesMapJson)
  return map
}

const validateDriveFile = (driveFile: UnvalidatedGoogleDriveFile): GoogleDriveFile => {
  if (!driveFile.id) {
    throw new RuntimeError('File ID is missing in Schema$File from the API response')
  }

  return {
    ...driveFile,
    id: driveFile.id,
  }
}

const validateDriveFiles = (driveFiles: UnvalidatedGoogleDriveFile[]): GoogleDriveFile[] => {
  return driveFiles.map((file) => validateDriveFile(file))
}

const isFolder = (file: GoogleDriveFile): boolean => {
  return file.mimeType === 'application/vnd.google-apps.folder'
}

/**
 * @returns GoogleDriveFile received from the API
 */
const getFileAndAddToKnownFiles = async (
  fileId: string,
  knownFilesMap: FilesMap,
  client: GoogleDriveClient
): Promise<GoogleDriveFile> => {
  const response = await client.files.get({
    fileId,
    fields: 'id, name, mimeType, parents',
  })
  const file = validateDriveFile(response.data)
  knownFilesMap[fileId] = file
  return file
}

const addParentsToKnownFiles = async (file: GoogleDriveFile, knownFilesMap: FilesMap, client: GoogleDriveClient) => {
  if (!file.parents) {
    return
  }
  const [parentId] = file.parents // We only support one parent per file
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }
  let parent = knownFilesMap[parentId]
  if (!parent) {
    parent = await getFileAndAddToKnownFiles(parentId, knownFilesMap, client)
  }
  await addParentsToKnownFiles(parent, knownFilesMap, client)
}

const getFilePath = (file: GoogleDriveFile, knownFilesMap: FilesMap): string => {
  if (!file.parents) {
    return `/${file.name}`
  }

  const [parentId] = file.parents // We only support one parent per file
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }
  const parent = knownFilesMap[parentId]
  if (!parent) {
    throw new RuntimeError(`Parent with ID ${parentId} of file ${file.name} not found`)
  }

  return `${getFilePath(parent, knownFilesMap)}/${file.name}`
}

export default {
  listFiles,
} as const satisfies bp.IntegrationProps['actions']
