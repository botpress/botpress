import { RuntimeError } from '@botpress/client'
import { getClient } from './client'
import { GoogleDriveClient, GoogleDriveFile, UnvalidatedGoogleDriveFile } from './types'
import * as bp from '.botpress'

const PAGE_SIZE = 10
const FOLDER_MIMETYPE = 'application/vnd.google-apps.folder'

type FilesMap = Record<string, GoogleDriveFile>
type ListActionProps = bp.ActionProps['listFiles'] | bp.ActionProps['listFolders']

const createFile: bp.IntegrationProps['actions']['createFile'] = async () => {
  return {
    // TODO: Implement completely once listFolders is complete
    id: 'id',
    name: 'name',
  }
}

const listFiles: bp.IntegrationProps['actions']['listFiles'] = async (props) => {
  const { client, ctx, input } = props
  if (!input.nextToken) {
    // Invalidate the known files map if starting from the beginning
    await saveKnownFilesMap({}, client, ctx)
  }
  const filesMap = await loadKnownFilesMap(client, ctx)

  const { updatedFilesMap, nextPageResults, nextToken } = await updateFilesMapFromNextPage({
    filesMap,
    props,
    nextToken: input.nextToken,
  })
  await saveKnownFilesMap(updatedFilesMap, client, ctx)

  const nonFolderDriveFiles = nextPageResults.filter((f) => !isFolder(f))
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

const listFolders: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const { input, client, ctx } = props
  if (!input.nextToken) {
    // Invalidate the known files map if starting from the beginning
    await saveKnownFilesMap({}, client, ctx)
  }
  const filesMap = await loadKnownFilesMap(client, ctx)

  const { updatedFilesMap, nextPageResults, nextToken } = await updateFilesMapFromNextPage({
    filesMap,
    props,
    nextToken: input.nextToken,
    searchQuery: `mimeType = \'${FOLDER_MIMETYPE}\'`,
  })
  await saveKnownFilesMap(updatedFilesMap, client, ctx)

  const items = nextPageResults.map((file) => ({
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

const updateFilesMapFromNextPage = async ({
  filesMap,
  nextToken,
  props: { client, ctx },
  searchQuery,
}: {
  filesMap: FilesMap
  nextToken?: string
  props: ListActionProps
  searchQuery?: string
}): Promise<{
  updatedFilesMap: FilesMap
  nextPageResults: GoogleDriveFile[]
  nextToken?: string
}> => {
  const googleClient = await getClient({ client, ctx })
  // TODO: Support shared drive
  const listResponse = await googleClient.files.list({
    corpora: 'user', // TODO: Limit to the configured drive if optional driveId is provided
    fields: 'files(id, name, mimeType, parents), nextPageToken',
    q: searchQuery,
    pageToken: nextToken,
    pageSize: PAGE_SIZE,
  })

  const newNextToken = listResponse.data.nextPageToken ?? undefined
  const unvalidatedDriveFiles = listResponse.data.files
  if (!unvalidatedDriveFiles) {
    throw new RuntimeError('No files were returned by the API')
  }
  const driveFiles = validateDriveFiles(unvalidatedDriveFiles)
  driveFiles.forEach((driveFile) => {
    filesMap[driveFile.id] = driveFile
  })

  for (const driveFile of driveFiles) {
    await addParentsToFilesMap(driveFile, filesMap, googleClient)
  }

  return {
    updatedFilesMap: filesMap,
    nextPageResults: driveFiles,
    nextToken: newNextToken,
  }
}

const saveKnownFilesMap = async (knownFilesMap: FilesMap, client: bp.Client, ctx: bp.Context) => {
  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      knownFilesMapJson: JSON.stringify(knownFilesMap),
    },
  })
}

const loadKnownFilesMap = async (client: bp.Client, ctx: bp.Context): Promise<FilesMap> => {
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
  return file.mimeType === FOLDER_MIMETYPE
}

/**
 * @returns GoogleDriveFile received from the API
 */
const getFileAndAddToFilesMap = async (
  fileId: string,
  filesMap: FilesMap,
  client: GoogleDriveClient
): Promise<GoogleDriveFile> => {
  const response = await client.files.get({
    fileId,
    fields: 'id, name, mimeType, parents',
  })
  const file = validateDriveFile(response.data)
  filesMap[fileId] = file
  return file
}

const addParentsToFilesMap = async (file: GoogleDriveFile, filesMap: FilesMap, client: GoogleDriveClient) => {
  if (!file.parents) {
    return
  }
  const [parentId] = file.parents // We only support one parent per file
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }
  let parent = filesMap[parentId]
  if (!parent) {
    parent = await getFileAndAddToFilesMap(parentId, filesMap, client)
  }
  await addParentsToFilesMap(parent, filesMap, client)
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
  listFolders,
  createFile,
} as const satisfies bp.IntegrationProps['actions']
