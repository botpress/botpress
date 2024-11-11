import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Stream } from 'stream'
import { getAuthenticatedGoogleClient } from './auth'
import { FOLDER_MIMETYPE, SHORTCUT_MIMETYPE } from './constants'
import { FilesCache } from './files-cache'
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
  parseGenericFile,
  parseGenericFiles,
  parseNormalFile,
} from './validation'
import * as bp from '.botpress'

const PAGE_SIZE = 10
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents, size'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`

export class Client {
  private constructor(private _client: bp.Client, private _ctx: bp.Context, private _googleClient: GoogleDriveClient) {}

  public static async create({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<Client> {
    const googleClient = await getAuthenticatedGoogleClient({
      client,
      ctx,
    })
    return new Client(client, ctx, googleClient)
  }

  public async listFiles(nextToken?: string): Promise<ListFileOutput> {
    const filesCache = nextToken
      ? await FilesCache.load({ client: this._client, ctx: this._ctx })
      : new FilesCache(this._client, this._ctx) // Invalidate cache when starting from scratch

    const { newFiles, newNextToken } = await this._fetchFilesAndUpdateCache({
      filesCache,
      nextToken,
      searchQuery: `mimeType != '${FOLDER_MIMETYPE}' and mimeType != '${SHORTCUT_MIMETYPE}'`,
    })
    const itemsPromises = newFiles
      .filter((f) => f.type === 'normal')
      .map((f) => this._getCompleteFileFromBaseFile(f, filesCache))
    const items = await Promise.all(itemsPromises)
    await filesCache.save()
    return {
      items,
      meta: {
        nextToken: newNextToken,
      },
    }
  }

  public async listFolders(nextToken?: string): Promise<ListFolderOutput> {
    const filesCache = nextToken
      ? await FilesCache.load({ client: this._client, ctx: this._ctx })
      : new FilesCache(this._client, this._ctx) // Invalidate cache when starting from scratch

    const { newFiles, newNextToken } = await this._fetchFilesAndUpdateCache({
      filesCache,
      nextToken,
      searchQuery: `mimeType = '${FOLDER_MIMETYPE}'`,
    })
    await filesCache.save()
    const itemsPromises = newFiles
      .filter((f) => f.type === 'folder')
      .map((f) => this._getCompleteFolderFromBaseFolder(f, filesCache))
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
    const file = parseNormalFile(response.data)
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async readFile(id: string): Promise<File> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    const file = parseNormalFile(response.data)
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
    const file = parseNormalFile(response.data)
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
    // TODO: Must use export in case of a Google Workspace document.
    // TODO: Need to map Google Workspace MIME types to the File's API supported MIME types
    const file = await this._fetchFile(fileId)
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
  private async _getCompleteFileFromBaseFile(file: BaseNormalFile, optionalFilesCache?: FilesCache): Promise<File> {
    const genericFile = convertNormalFileToGeneric(file)
    const { filesCache } = await this._addParentsToFilesCache(genericFile, optionalFilesCache)
    const { id, mimeType, name, parentId, size } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      size,
      path: this._getFilePath(id, filesCache),
    }
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFolderFromBaseFolder(
    file: BaseFolderFile,
    optionalFilesCache?: FilesCache
  ): Promise<Folder> {
    const genericFile = convertFolderFileToGeneric(file)
    const { filesCache } = await this._addParentsToFilesCache(genericFile, optionalFilesCache)
    const { id, mimeType, name, parentId } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      path: this._getFilePath(id, filesCache),
    }
  }

  private async _fetchFilesAndUpdateCache({
    filesCache,
    nextToken,
    searchQuery,
  }: {
    filesCache: FilesCache
    nextToken?: string
    searchQuery?: string
  }): Promise<{
    newFiles: BaseGenericFile[]
    newNextToken?: string
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
    const newFiles = parseGenericFiles(unvalidatedDriveFiles)
    for (const newFile of newFiles) {
      filesCache.set(newFile)
    }

    return {
      newFiles,
      newNextToken,
    }
  }

  private _addParentsToFilesCache = async (
    file: BaseGenericFile,
    optionalFilesCache?: FilesCache
  ): Promise<{
    newFiles: BaseGenericFile[]
    filesCache: FilesCache
  }> => {
    const filesCache = optionalFilesCache ?? new FilesCache(this._client, this._ctx)
    filesCache.set(file) // Set if not already set

    const { parentId } = file
    if (!parentId) {
      return { newFiles: [], filesCache }
    }

    const newFiles: BaseGenericFile[] = []
    let parent = filesCache.find(parentId)
    if (!parent) {
      parent = await this._fetchFile(parentId)
      filesCache.set(parent)
      newFiles.push(parent)
    }
    const { newFiles: parentNewFiles } = await this._addParentsToFilesCache(parent, filesCache)
    newFiles.push(...parentNewFiles)
    return { newFiles, filesCache }
  }

  private async _fetchFile(id: string): Promise<BaseGenericFile> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    return parseGenericFile(response.data)
  }

  private _getFilePath = (id: string, filesCache: FilesCache): string[] => {
    const file = filesCache.get(id)
    if (!file.parentId) {
      return [file.name]
    }

    return [...this._getFilePath(file.parentId, filesCache), file.name]
  }
}
