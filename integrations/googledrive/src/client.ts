import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Stream } from 'stream'
import { getAuthenticatedGoogleClient } from './auth'
import { FOLDER_MIMETYPE } from './constants'
import { FilesMap } from './files-map'
import {
  BaseGenericFile,
  GoogleDriveClient,
  BaseNormalFile,
  File,
  BaseFolderFile,
  Folder,
  ListFileOutput,
  ListFolderOutput,
  CreateFileArgs,
  UpdateFileArgs,
  UploadFileDataArgs,
  DownloadFileDataArgs,
  DownloadFileDataOutput,
} from './types'
import {
  convertFolderFileToGeneric,
  convertNormalFileToGeneric,
  validateGenericFile,
  validateGenericFiles,
  validateNormalFile,
} from './validation'
import * as bp from '.botpress'

const PAGE_SIZE = 10
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents, size'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`

export class Client {
  private constructor(private _client: bp.Client, private _ctx: bp.Context, private _googleClient: GoogleDriveClient) {}

  public static async client({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<Client> {
    const googleClient = await getAuthenticatedGoogleClient({
      client,
      ctx,
    })
    return new Client(client, ctx, googleClient)
  }

  public async listFiles(nextToken?: string): Promise<ListFileOutput> {
    const filesMap = nextToken
      ? await FilesMap.load({ client: this._client, ctx: this._ctx })
      : new FilesMap(this._client, this._ctx) // Invalidate map when starting from scratch

    const { newFilesIds, nextToken: newNextToken } = await this._updateFilesMapFromNextPage({
      filesMap,
      nextToken,
    })
    const itemsPromises = newFilesIds
      .map((id) => filesMap.get(id))
      .filter((f) => f.type === 'normal')
      .map((f) => this._getCompleteFileFromBaseFile(f, filesMap))
    const items = await Promise.all(itemsPromises)
    await filesMap.save()
    return {
      items,
      meta: {
        nextToken: newNextToken,
      },
    }
  }

  public async listFolders(nextToken?: string): Promise<ListFolderOutput> {
    const filesMap = nextToken
      ? await FilesMap.load({ client: this._client, ctx: this._ctx })
      : new FilesMap(this._client, this._ctx) // Invalidate map when starting from scratch

    const { newFilesIds, nextToken: newNextToken } = await this._updateFilesMapFromNextPage({
      filesMap,
      nextToken,
      searchQuery: `mimeType = '${FOLDER_MIMETYPE}'`,
    })
    await filesMap.save()
    const itemsPromises = newFilesIds
      .map((id) => filesMap.getFolder(id))
      .map((f) => this._getCompleteFolderFromBaseFolder(f, filesMap))
    const items = await Promise.all(itemsPromises)
    return {
      items,
      meta: {
        nextToken: newNextToken,
      },
    }
  }

  public async createFile({ name, parentId, mimeType }: CreateFileArgs): Promise<File> {
    const response = await this._googleClient.files.create({
      fields: GOOGLE_API_FILE_FIELDS,
      requestBody: {
        name,
        parents: parentId ? [parentId] : undefined,
        mimeType,
      },
    })
    const file = validateNormalFile(response.data)
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async readFile(id: string): Promise<File> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    const file = validateNormalFile(response.data)
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async updateFile({ id: fileId, name, parentId }: UpdateFileArgs): Promise<File> {
    const addParents = parentId ? `${parentId}` : undefined
    const response = await this._googleClient.files.update({
      fields: GOOGLE_API_FILE_FIELDS,
      fileId,
      addParents, // Also removes old parents
      requestBody: {
        name,
      },
    })
    const file = validateNormalFile(response.data)
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async deleteFile(id: string) {
    await this._googleClient.files.delete({
      fileId: id,
    })
  }

  public async uploadFileData({ id: fileId, url, mimeType }: UploadFileDataArgs) {
    const downloadBpFileResp = await axios.get<Stream>(url, {
      responseType: 'stream',
    })
    const downloadStream = downloadBpFileResp.data

    await this._googleClient.files.update({
      fileId,
      media: {
        body: downloadStream,
        mimeType,
      },
    })
  }

  public async downloadFileData({ id: fileId, index }: DownloadFileDataArgs): Promise<DownloadFileDataOutput> {
    // TODO: Must use export in case of a Google Workspace document
    const file = await this._getFileFromGoogleDrive(fileId)
    if (file.type !== 'normal') {
      throw new RuntimeError(`Attempted to download a file of type ${file.type}`)
    }

    const { mimeType: contentType, size } = file
    const fileDownloadResponse = await this._googleClient.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      }
    )
    const fileDownloadStream = fileDownloadResponse.data
    const { file: bpFile } = await this._client.upsertFile({
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

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFileFromBaseFile(file: BaseNormalFile, optionalFilesMap?: FilesMap): Promise<File> {
    const genericFile = convertNormalFileToGeneric(file)
    const { filesMap } = await this._addParentsToFilesMap(genericFile, optionalFilesMap)
    const { id, mimeType, name, parentId, size } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      size,
      path: this._getFilePath(id, filesMap),
    }
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFolderFromBaseFolder(file: BaseFolderFile, optionalFilesMap?: FilesMap): Promise<Folder> {
    const genericFile = convertFolderFileToGeneric(file)
    const { filesMap } = await this._addParentsToFilesMap(genericFile, optionalFilesMap)
    const { id, mimeType, name, parentId } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      path: this._getFilePath(id, filesMap),
    }
  }

  private async _updateFilesMapFromNextPage({
    filesMap,
    nextToken,
    searchQuery,
  }: {
    filesMap: FilesMap
    nextToken?: string
    searchQuery?: string
  }): Promise<{
    newFilesIds: string[]
    nextToken?: string
  }> {
    const listResponse = await this._googleClient.files.list({
      corpora: 'user',
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
    const files = validateGenericFiles(unvalidatedDriveFiles)
    files.forEach((file) => {
      filesMap.set(file)
    })

    const newFilesIds: string[] = files.map((f) => f.id)
    for (const file of files) {
      // Fetch missing parent files immediately in order to be able to reconstruct every new file's path
      const { newFilesIds: newParentFilesIds } = await this._addParentsToFilesMap(file, filesMap)
      newFilesIds.push(...newParentFilesIds)
    }

    return {
      newFilesIds,
      nextToken: newNextToken,
    }
  }

  private _addParentsToFilesMap = async (
    file: BaseGenericFile,
    optionalFilesMap?: FilesMap
  ): Promise<{
    newFilesIds: string[]
    filesMap: FilesMap
  }> => {
    const filesMap = optionalFilesMap ?? new FilesMap(this._client, this._ctx)
    filesMap.set(file) // Set if not already set

    const { parentId } = file
    if (!parentId) {
      return { newFilesIds: [], filesMap }
    }

    const newFilesIds: string[] = []
    let parent: BaseGenericFile | undefined
    if (filesMap.has(parentId)) {
      parent = filesMap.get(parentId)
    }
    if (!parent) {
      parent = await this._getFileFromGoogleDrive(parentId)
      filesMap.set(parent)
      newFilesIds.push(parent.id)
    }
    const { newFilesIds: parentNewFilesIds } = await this._addParentsToFilesMap(parent, filesMap)
    newFilesIds.push(...parentNewFilesIds)
    return { newFilesIds, filesMap }
  }

  private async _getFileFromGoogleDrive(id: string): Promise<BaseGenericFile> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    return validateGenericFile(response.data)
  }

  private _getFilePath = (id: string, filesMap: FilesMap): string => {
    const file = filesMap.get(id)
    if (!file.parentId) {
      return `/${file.name}`
    }

    return `${this._getFilePath(file.parentId, filesMap)}/${file.name}`
  }
}
