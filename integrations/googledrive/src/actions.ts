import { RuntimeError } from '@botpress/client'
import { getClient } from './client'
import { GoogleDriveClient, GoogleDriveFile, UnvalidatedGoogleDriveFile } from './types'
import * as bp from '.botpress'

const PAGE_SIZE = 10
const FOLDER_MIMETYPE = 'application/vnd.google-apps.folder'
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`

type FilesMap = Record<string, GoogleDriveFile>
type ListActionProps = bp.ActionProps['listFiles'] | bp.ActionProps['listFolders']

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
    .map((id) => getFile(id, filesMap))
    .filter((f) => !isFolder(f))
    .map((f) => f.id)

  const items = nonFolderFilesIds.map((id) => ({
    id,
    name: getFilePath(id, filesMap),
    parentId: getParentId(id, filesMap),
  }))

  return {
    items,
    meta: {
      nextToken,
    },
  }
}

const listFolders: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  // TODO: Always add My Drive
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
    parentId: getParentId(id, filesMap),
  }))
  return {
    items,
    meta: {
      nextToken,
    },
  }
}

const createFile: bp.IntegrationProps['actions']['createFile'] = async (props) => {
  const { client, ctx, input } = props
  const { name: inName, parentId: inParentId } = input
  if (inName.length <= 0) {
    throw new RuntimeError('File name cannnot be empty for file')
  }

  const googleClient = await getClient({ client, ctx })
  const response = await googleClient.files.create({
    fields: GOOGLE_API_FILE_FIELDS,
    requestBody: {
      name: inName,
      parents: inParentId ? [inParentId] : undefined,
    },
    media: undefined, // TODO: Add option to upload data in create? (Is there any other way besides create or update?)
  })

  const { id, name, parentId } = validateDriveFile(response.data)
  return {
    id,
    name,
    parentId,
  }
}

const readFile: bp.IntegrationProps['actions']['readFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id: inId } = input
  const googleClient = await getClient({ client, ctx })
  const { id, name, parentId } = await getFileFromGoogleDrive(inId, googleClient)
  return {
    id,
    name,
    parentId,
  }
}

const updateFile: bp.IntegrationProps['actions']['updateFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id: fileId, name: inName, parentId: inParentId } = input
  const addParents = inParentId ? `${inParentId}` : undefined
  const googleClient = await getClient({ client, ctx })
  const response = await googleClient.files.update({
    fields: GOOGLE_API_FILE_FIELDS,
    fileId,
    addParents, // Removes old parents
    requestBody: {
      name: inName,
    },
  })
  const { id, name, parentId } = validateDriveFile(response.data)
  return {
    id,
    name,
    parentId,
  }
}

const deleteFile: bp.IntegrationProps['actions']['deleteFile'] = async (props) => {
  const { client, ctx, input } = props
  const fileId = input.id
  const googleClient = await getClient({ client, ctx })
  await googleClient.files.delete({
    fileId,
  })
  return {}
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
    fields: GOOGLE_API_FILELIST_FIELDS,
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
  const { id, name } = driveFile
  if (!id) {
    throw new RuntimeError('File ID is missing in Schema$File from the API response')
  }

  if (!name) {
    throw new RuntimeError(`Name is missing in Schema$File from the API response for file with ID=${driveFile.id}`)
  }

  let parentId: string | undefined = undefined
  if (driveFile.parents) {
    parentId = driveFile.parents[0]
    if (!parentId) {
      throw new RuntimeError(
        `Empty parent ID array in Schema$File from the API response for file with name=${driveFile.name}`
      )
    }
  }

  return {
    ...driveFile,
    id,
    name,
    parentId,
  }
}

const validateDriveFiles = (driveFiles: UnvalidatedGoogleDriveFile[]): GoogleDriveFile[] => {
  return driveFiles.map((file) => validateDriveFile(file))
}

const isFolder = (file: GoogleDriveFile): boolean => {
  return file.mimeType === FOLDER_MIMETYPE
}

/**
 * @returns Validated GoogleDriveFile received from the API
 */
const getFileFromGoogleDrive = async (fileId: string, client: GoogleDriveClient): Promise<GoogleDriveFile> => {
  const response = await client.files.get({
    fileId,
    fields: GOOGLE_API_FILE_FIELDS,
  })
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
  if (!file.parentId) {
    return []
  }

  const newFilesIds: string[] = []
  let parent = filesMap[file.parentId]
  if (!parent) {
    parent = await getFileFromGoogleDrive(file.parentId, client)
    filesMap[parent.id] = parent
    newFilesIds.push(parent.id)
  }
  const parentNewFilesIds = await addParentsToFilesMap(parent, filesMap, client)
  newFilesIds.push(...parentNewFilesIds)
  return newFilesIds
}

const getFilePath = (fileId: string, filesMap: FilesMap): string => {
  const file = getFile(fileId, filesMap)
  if (!file.parentId) {
    return `/${file.name}`
  }

  return `${getFilePath(file.parentId, filesMap)}/${file.name}`
}

const getFile = (fileId: string, filesMap: FilesMap): GoogleDriveFile => {
  const file = filesMap[fileId]
  if (!file) {
    throw new RuntimeError(`Couldn't get file from files map with ID=${fileId}`)
  }
  return file
}

const getParentId = (fileId: string, filesMap: FilesMap): string | undefined => {
  const file = getFile(fileId, filesMap)
  return file.parentId
}

export default {
  listFiles,
  listFolders,
  createFile,
  readFile,
  updateFile,
  deleteFile,
} as const satisfies bp.IntegrationProps['actions']
