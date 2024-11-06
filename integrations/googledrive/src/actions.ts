import { RuntimeError } from '@botpress/client'
import axios, { AxiosError } from 'axios'
import { Stream } from 'stream'
import { getClient } from './client'
import { FOLDER_MIMETYPE, SHORTCUT_MIMETYPE } from './constants'
import { GoogleDriveClient, GoogleDriveFile, UnvalidatedGoogleDriveFile, File } from './types'
import * as bp from '.botpress'

const PAGE_SIZE = 10
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents, size'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`

type GoogleDriveFilesMap = Record<string, GoogleDriveFile>
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
    .map((id) => getDriveFile(id, filesMap))
    .filter((f) => !isFolder(f))
    .map((f) => f.id)

  const items = nonFolderFilesIds.map((id) => getFile(id, filesMap))

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

  const items = newFilesIds.map((id) => getFile(id, filesMap))
  return {
    items,
    meta: {
      nextToken,
    },
  }
}

const createFile: bp.IntegrationProps['actions']['createFile'] = async (props) => {
  const { client, ctx, input } = props
  const { name: inName, parentId: inParentId, mimeType } = input
  if (inName.length <= 0) {
    throw new RuntimeError('File name cannnot be empty for file')
  }

  const googleClient = await getClient({ client, ctx })
  const response = await googleClient.files.create({
    fields: GOOGLE_API_FILE_FIELDS,
    requestBody: {
      name: inName,
      parents: inParentId ? [inParentId] : undefined,
      mimeType,
    },
    media: undefined, // Data is uploaded using the 'uploadFileData' action
  })

  const driveFile = validateDriveFile(response.data)
  return await getFileFromDriveFile(driveFile, googleClient)
}

const readFile: bp.IntegrationProps['actions']['readFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id } = input
  const googleClient = await getClient({ client, ctx })

  const driveFile = await getFileFromGoogleDrive(id, googleClient)
  return await getFileFromDriveFile(driveFile, googleClient)
}

const updateFile: bp.IntegrationProps['actions']['updateFile'] = async (props) => {
  const { client, ctx, input } = props
  const { id: fileId, name, parentId } = input
  const addParents = parentId ? `${parentId}` : undefined
  const googleClient = await getClient({ client, ctx })
  const response = await googleClient.files.update({
    fields: GOOGLE_API_FILE_FIELDS,
    fileId,
    addParents, // Removes old parents
    requestBody: {
      name,
    },
  })

  const driveFile = validateDriveFile(response.data)
  return await getFileFromDriveFile(driveFile, googleClient)
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

const uploadFileData: bp.IntegrationProps['actions']['uploadFileData'] = async (props) => {
  const { client, ctx, input } = props
  const { id: fileId, url, mimeType } = input
  const googleClient = await getClient({ client, ctx })

  const downloadBpFileResp = await axios.get<Stream>(url, {
    responseType: 'stream',
  })
  const downloadStream = downloadBpFileResp.data

  await googleClient.files.update({
    fileId,
    media: {
      body: downloadStream,
      mimeType,
    },
  })

  return {}
}

const downloadFileData: bp.IntegrationProps['actions']['downloadFileData'] = async (props) => {
  const { client, ctx, input } = props
  const { id: fileId, index } = input
  const googleClient = await getClient({ client, ctx })
  // TODO: Must use export in case of a Google Workspace document
  const { mimeType: contentType, sizeInt: optionalSize } = await getFileFromGoogleDrive(fileId, googleClient)
  const size = optionalSize ?? 0
  const fileDownloadResponse = await googleClient.files.get(
    {
      fileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
    }
  )
  const fileDownloadStream = fileDownloadResponse.data
  const { file: bpFile } = await client.upsertFile({
    key: fileId,
    size,
    contentType,
    index,
  })
  const { id: bpFileId, uploadUrl } = bpFile

  const headers = {
    'Content-Type': contentType,
    'Content-Length': size,
  }
  await axios
    .put(uploadUrl, fileDownloadStream, {
      maxBodyLength: size,
      headers,
    })
    .catch((reason: AxiosError) => {
      throw new RuntimeError(`Error uploading file to botpress file API: ${reason}`)
    })

  return {
    bpFileId,
  }
}

const updateFilesMapFromNextPage = async ({
  filesMap,
  nextToken,
  props: { client, ctx },
  searchQuery,
}: {
  filesMap: GoogleDriveFilesMap
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
  files.forEach((file) => {
    filesMap[file.id] = file
  })

  const newFilesIds: string[] = files.map((f) => f.id)
  for (const file of files) {
    // Fetch missing parent files immediately in order to be able to reconstruct every new file's path
    const newParentFilesIds = await addParentsToFilesMap(file, filesMap, googleClient)
    newFilesIds.push(...newParentFilesIds)
  }

  return {
    newFilesIds,
    nextToken: newNextToken,
  }
}

const saveFilesMap = async (filesMap: GoogleDriveFilesMap, client: bp.Client, ctx: bp.Context) => {
  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      filesMap: JSON.stringify(filesMap),
    },
  })
}

const loadFilesMap = async (client: bp.Client, ctx: bp.Context): Promise<GoogleDriveFilesMap> => {
  const getStateResponse = await client.getOrSetState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'list',
    payload: {
      filesMap: JSON.stringify({}),
    },
  })
  const map: GoogleDriveFilesMap = JSON.parse(getStateResponse.state.payload.filesMap)
  return map
}

const validateDriveFile = (driveFile: UnvalidatedGoogleDriveFile): GoogleDriveFile => {
  const { id, name, mimeType, size: sizeStr } = driveFile
  if (!id) {
    throw new RuntimeError('File ID is missing in Schema$File from the API response')
  }

  if (!name) {
    throw new RuntimeError(`Name is missing in Schema$File from the API response for file with ID=${driveFile.id}`)
  }

  if (!mimeType) {
    throw new RuntimeError(`MIME type is missing in Schema$File from the API response for file with name=${name}`)
  }

  // TODO: Refactor file type validation
  const isNormalFileType = mimeType !== FOLDER_MIMETYPE && mimeType !== SHORTCUT_MIMETYPE
  let sizeInt = 0
  if (isNormalFileType) {
    if (!sizeStr) {
      throw new RuntimeError(`Size is missing in Schema$File from the API response for file with name=${name}`)
    }
    sizeInt = parseInt(sizeStr)
    if (isNaN(sizeInt)) {
      throw new RuntimeError(
        `Invalid size returned in Schema$File from the API response for file with name=${name} (size=${sizeStr})`
      )
    }
  }

  let parentId: string | undefined = undefined
  if (driveFile.parents) {
    parentId = driveFile.parents[0]
    if (!parentId) {
      throw new RuntimeError(`Empty parent ID array in Schema$File from the API response for file with name=${name}`)
    }
  }

  return {
    id,
    name,
    parentId,
    mimeType,
    sizeInt,
  }
}

const validateDriveFiles = (driveFiles: UnvalidatedGoogleDriveFile[]): GoogleDriveFile[] => {
  return driveFiles.map((file) => validateDriveFile(file))
}

const isFolder = (file: GoogleDriveFile | File): boolean => {
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
 * @returns Parent files IDs that needed to be fetched from the Google Drive API
 */
const addParentsToFilesMap = async (
  file: GoogleDriveFile,
  filesMap: GoogleDriveFilesMap,
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

const getFilePath = (id: string, filesMap: GoogleDriveFilesMap): string => {
  const file = getDriveFile(id, filesMap)
  if (!file.parentId) {
    return `/${file.name}`
  }

  return `${getFilePath(file.parentId, filesMap)}/${file.name}`
}

const getFile = (id: string, filesMap: GoogleDriveFilesMap): File => {
  const driveFile = getDriveFile(id, filesMap)
  return {
    ...driveFile,
    path: getFilePath(id, filesMap),
    size: driveFile.sizeInt ?? 0, // Zero if not present //TODO: Better modelize types to ensure size is set on normal files but not on folders|shortcut
  }
}

const getDriveFile = (id: string, filesMap: GoogleDriveFilesMap): GoogleDriveFile => {
  const file = filesMap[id]
  if (!file) {
    throw new RuntimeError(`Couldn't get file from files map with ID=${id}`)
  }
  return file
}

const getFileFromDriveFile = async (
  driveFile: GoogleDriveFile,
  googleClient: GoogleDriveClient,
  filesMap?: GoogleDriveFilesMap
) => {
  const validFilesMap = filesMap ?? {}
  const { id } = driveFile
  validFilesMap[id] = driveFile // Set if not already set
  await addParentsToFilesMap(driveFile, validFilesMap, googleClient)
  return getFile(id, validFilesMap)
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
