import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Readable, Stream } from 'stream'
import { getAuthenticatedGoogleClient } from './auth'
import { FilesCache } from './files-cache'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE, INDEXABLE_MIMETYPES } from './mime-types'
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
import { streamToBuffer } from './utils'
import {
  convertFolderFileToGeneric,
  convertNormalFileToGeneric,
  parseGenericFile,
  parseGenericFiles,
  parseNormalFile,
} from './validation'
import * as bp from '.botpress'

type FileStreamUploadParams = Parameters<bp.Client['upsertFile']>[0]
type FileBufferUploadParams = Omit<Parameters<bp.Client['uploadFile']>[0], 'content'>

const MAX_EXPORT_FILE_SIZE = 10000000 // 10MB, as per the Google Drive API doc
const MYDRIVE_ID_ALIAS = 'root'
const PAGE_SIZE = 10
const GOOGLE_API_EXPORTFORMATS_FIELDS = 'exportFormats'
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
      searchQuery: `mimeType != '${APP_GOOGLE_FOLDER_MIMETYPE}' and mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`,
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
    const isFirstRequest = nextToken === undefined
    const filesCache = isFirstRequest
      ? await FilesCache.load({ client: this._client, ctx: this._ctx })
      : new FilesCache(this._client, this._ctx) // Invalidate cache when starting from scratch

    const { newFiles, newNextToken } = await this._fetchFilesAndUpdateCache({
      filesCache,
      nextToken,
      searchQuery: `mimeType = '${APP_GOOGLE_FOLDER_MIMETYPE}'`,
    })
    if (isFirstRequest) {
      // My Drive is not returned by list operation but needs to be part of list
      const myDriveFile = await this._fetchFile(MYDRIVE_ID_ALIAS)
      newFiles.push(myDriveFile)
      filesCache.set(myDriveFile)
    }

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
    const file = await this._fetchFile(fileId)
    if (file.type !== 'normal') {
      throw new RuntimeError(`Attempted to download a file of type ${file.type}`)
    }

    const exportType = await this._findExportType(file.mimeType)
    const isExport = exportType !== undefined
    const uploadParams = {
      key: file.id,
      contentType: isExport ? exportType : file.mimeType,
      index,
    }
    let bpFileId: string | undefined
    if (isExport) {
      const fileDownloadStream = await this._exportFileData(file, exportType)
      const fileDownloadBuffer = await streamToBuffer(fileDownloadStream, MAX_EXPORT_FILE_SIZE)
      bpFileId = await this._uploadBufferToBpFiles(fileDownloadBuffer, uploadParams)
    } else {
      const fileDownloadStream = await this._fetchFileData(file)
      bpFileId = await this._uploadStreamToBpFiles(fileDownloadStream, {
        ...uploadParams,
        size: file.size,
      })
    }
    return { bpFileId }
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

  private async _fetchFileData({ id: fileId }: BaseNormalFile): Promise<Readable> {
    const fileDownloadResponse = await this._googleClient.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      }
    )
    return fileDownloadResponse.data
  }

  private async _exportFileData({ id: fileId }: BaseNormalFile, mimeType: string): Promise<Readable> {
    const fileExportResponse = await this._googleClient.files.export(
      {
        fileId,
        mimeType,
      },
      {
        responseType: 'stream',
      }
    )
    return fileExportResponse.data
  }

  /**
   * @returns The Botpress file ID of the newly uploaded file
   */
  private async _uploadBufferToBpFiles(buffer: Buffer, params: FileBufferUploadParams): Promise<string> {
    const { file } = await this._client.uploadFile({
      ...params,
      content: buffer,
    })

    return file.id
  }

  /**
   * @returns The Botpress file ID of the newly uploaded file
   */
  private async _uploadStreamToBpFiles(stream: Readable, params: FileStreamUploadParams): Promise<string> {
    const { file } = await this._client.upsertFile(params)
    const { contentType, size } = params
    const { id, uploadUrl } = file

    const headers = {
      'Content-Type': contentType,
      'Content-Length': size,
    }
    await axios
      .put(uploadUrl, stream, {
        maxBodyLength: size,
        headers,
      })
      .catch((reason: AxiosError) => {
        throw new RuntimeError(`Error uploading file to botpress file API: ${reason}`)
      })

    return id
  }

  private async _fetchExportFormatMap(): Promise<Record<string, string[]>> {
    const response = await this._googleClient.about.get({
      fields: GOOGLE_API_EXPORTFORMATS_FIELDS,
    })
    const { exportFormats } = response.data
    if (!exportFormats) {
      throw new RuntimeError('Export formats are missing in Schema$About from the API response')
    }
    return exportFormats
  }

  /**
   * @returns The export type to use, or undefined if the file cannot be exported
   */
  private async _findExportType(originalContentType: string): Promise<string | undefined> {
    const exportFormatMap = await this._fetchExportFormatMap()
    const exportContentTypes = exportFormatMap[originalContentType]
    if (!exportContentTypes) {
      return undefined
    }

    let exportContentType = exportContentTypes[0] // Default
    if (!exportContentType) {
      return undefined
    }

    for (const indexableContentType of INDEXABLE_MIMETYPES) {
      // Check if can be exported to an indexable type
      if (exportContentTypes.includes(indexableContentType)) {
        exportContentType = indexableContentType
        break
      }
    }

    return exportContentType
  }

  private _getFilePath = (id: string, filesCache: FilesCache): string[] => {
    const file = filesCache.get(id)
    if (!file.parentId) {
      return [file.name]
    }

    return [...this._getFilePath(file.parentId, filesCache), file.name]
  }
}
