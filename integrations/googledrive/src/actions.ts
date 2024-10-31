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
    await saveFilesMap({}, client, ctx)
  }
  const filesMap = await loadFilesMap(client, ctx)

  const { newFilesIds, nextToken } = await updateFilesMapFromNextPage({
    filesMap,
    props,
    nextToken: input.nextToken,
  })
  await saveFilesMap(filesMap, client, ctx)

  const nonFolderFilesIds = newFilesIds
    .map((id) => {
      const file = filesMap[id]
      if (!file) {
        throw new RuntimeError(`Could not find file in known files map with ID ${id}`)
      }
      return file
    })
    .filter((f) => !isFolder(f))
    .map((f) => f.id)

  const items = nonFolderFilesIds.map((id) => ({
    id,
    name: getFilePath(id, filesMap),
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
    await saveFilesMap({}, client, ctx)
  }
  const filesMap = await loadFilesMap(client, ctx)

  const { newFilesIds, nextToken } = await updateFilesMapFromNextPage({
    filesMap,
    props,
    nextToken: input.nextToken,
    searchQuery: `mimeType = \'${FOLDER_MIMETYPE}\'`,
  })
  await saveFilesMap(filesMap, client, ctx)

  const items = newFilesIds.map((id) => ({
    id,
    name: getFilePath(id, filesMap),
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
  newFilesIds: string[]
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
  const files = validateDriveFiles(unvalidatedDriveFiles)
  files.forEach((driveFile) => {
    filesMap[driveFile.id] = driveFile
  })

  const newFilesIds: string[] = files.map((f) => f.id)
  for (const driveFile of files) {
    // Fetch missing parent files immediately in order to be able to reconstruct every new file's path
    const newParentFilesIds = await addParentsToFilesMap(driveFile, filesMap, googleClient)
    newFilesIds.push(...newParentFilesIds)
  }

  return {
    newFilesIds,
    nextToken: newNextToken,
  }
}

const saveFilesMap = async (filesMap: FilesMap, client: bp.Client, ctx: bp.Context) => {
  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      filesMap: JSON.stringify(filesMap),
    },
  })
}

const loadFilesMap = async (client: bp.Client, ctx: bp.Context): Promise<FilesMap> => {
  const getStateResponse = await client.getOrSetState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      filesMap: JSON.stringify({}),
    },
  })
  const map: FilesMap = JSON.parse(getStateResponse.state.payload.filesMap)
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
const getFile = async (
  fileId: string,
  client: GoogleDriveClient
): Promise<GoogleDriveFile> => {
  const response = await client.files.get({
    fileId,
    fields: 'id, name, mimeType, parents',
  })
  console.log('getFile', response)
  return validateDriveFile(response.data)
}

/**
 *
 * @returns Parent files IDs that needed to be fetched from the Google Drive API
 */
const addParentsToFilesMap = async (
  file: GoogleDriveFile,
  filesMap: FilesMap,
  client: GoogleDriveClient
): Promise<string[]> => {
  if (!file.parents) {
    return []
  }
  const [parentId] = file.parents // We only support one parent per file
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }
  const newFilesIds: string[] = []
  let parent = filesMap[parentId]
  if (!parent) {
    parent = await getFile(parentId, client)
    filesMap[parent.id] = parent
    newFilesIds.push(parent.id)
  }
  const parentNewFilesIds = await addParentsToFilesMap(parent, filesMap, client)
  newFilesIds.push(...parentNewFilesIds)
  return newFilesIds
}

const getFilePath = (fileId: string, knownFilesMap: FilesMap): string => {
  const file = knownFilesMap[fileId]
  if (!file) {
    throw new RuntimeError(`Could not find file in known files map with ID ${fileId}`)
  }

  if (!file.parents) {
    return `/${file.name}`
  }

  const [parentId] = file.parents // We only support one parent per file
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }

  return `${getFilePath(parentId, knownFilesMap)}/${file.name}`
}

export default {
  listFiles,
  listFolders,
  createFile,
} as const satisfies bp.IntegrationProps['actions']
