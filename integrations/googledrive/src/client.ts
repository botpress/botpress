import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { Readable, Stream } from 'stream'
import { v4 as uuidv4 } from 'uuid'
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
  ListFilesOutput,
  ListFoldersOutput,
  CreateFileArgs,
  UpdateFileArgs,
  UploadFileDataArgs,
  DownloadFileDataArgs,
  DownloadFileDataOutput,
  ListItemsInput,
  ListItemsOutput,
} from './types'
import { listItemsAndProcess, ListFunction, streamToBuffer } from './utils'
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

const MAX_RESOURCE_WATCH_EXPIRATION_DELAY_MS = 86400 * 1000 // 24 hours
const MAX_EXPORT_FILE_SIZE_BYTES = 10000000 // 10MB, as per the Google Drive API doc
const MYDRIVE_ID_ALIAS = 'root'
const PAGE_SIZE = 10
const GOOGLE_API_EXPORTFORMATS_FIELDS = 'exportFormats'
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents, size'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`

export class Client {
  private constructor(
    private _client: bp.Client,
    private _ctx: bp.Context,
    private _googleClient: GoogleDriveClient,
    private _filesCache: FilesCache,
    private _logger: bp.Logger
  ) {}

  public static async create({
    client,
    ctx,
    logger,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<Client> {
    const googleClient = await getAuthenticatedGoogleClient({
      client,
      ctx,
    })
    const filesCache = await FilesCache.load({ client, ctx }) // TODO: Give option to prevent cache loading and saving
    return new Client(client, ctx, googleClient, filesCache, logger)
  }

  public async listFiles({ nextToken }: ListItemsInput): Promise<ListFilesOutput> {
    if (!nextToken) {
      this._filesCache.clear() // Invalidate cache when starting from scratch
    }

    const { items: baseFiles, meta } = await this._listBaseFiles({ nextToken })
    const completeFilesPromises = baseFiles.map((f) => this._getCompleteFileFromBaseFile(f))
    const items = await Promise.all(completeFilesPromises)
    await this._filesCache.save()
    return {
      items,
      meta,
    }
  }

  private async _listBaseFiles({ nextToken }: ListItemsInput): Promise<ListItemsOutput<BaseNormalFile>> {
    const { newFiles, newNextToken } = await this._fetchFiles({
      nextToken,
      searchQuery: `mimeType != '${APP_GOOGLE_FOLDER_MIMETYPE}' and mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`,
    })
    const items = newFiles.filter((f) => f.type === 'normal')
    return {
      items,
      meta: {
        nextToken: newNextToken,
      },
    }
  }

  public async listFolders({ nextToken }: ListItemsInput): Promise<ListFoldersOutput> {
    const isFirstRequest = nextToken === undefined
    if (isFirstRequest) {
      this._filesCache.clear() // Invalidate cache when starting from scratch
    }

    const { items: baseFolders, meta } = await this._listBaseFolders({ nextToken })

    const completeFoldersPromises = baseFolders.map((f) => this._getCompleteFolderFromBaseFolder(f))
    const items = await Promise.all(completeFoldersPromises)
    await this._filesCache.save()
    return {
      items,
      meta,
    }
  }

  private async _listBaseFolders({ nextToken }: ListItemsInput): Promise<ListItemsOutput<BaseFolderFile>> {
    const { newFiles, newNextToken } = await this._fetchFiles({
      nextToken,
      searchQuery: `mimeType = '${APP_GOOGLE_FOLDER_MIMETYPE}'`,
    })
    if (nextToken === undefined) {
      // My Drive is not returned by list operation but needs to be part of list, so we add it to first page
      const myDriveFile = await this._fetchFile(MYDRIVE_ID_ALIAS)
      newFiles.push(myDriveFile)
    }
    const items = newFiles.filter((f) => f.type === 'folder')
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
    const uploadParams = {
      key: file.id,
      contentType: exportType ?? file.mimeType,
      index,
    }
    let bpFileId: string
    if (exportType) {
      const fileDownloadStream = await this._exportFileData(file, exportType)
      const fileDownloadBuffer = await streamToBuffer(fileDownloadStream, MAX_EXPORT_FILE_SIZE_BYTES)
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

  private async _watchAllItems<T extends BaseFolderFile | BaseNormalFile>(listFn: ListFunction<T>) {
    await listItemsAndProcess(listFn, async (item) => {
      this._logger
        .forBot()
        .debug(`Watching ${item.mimeType === APP_GOOGLE_FOLDER_MIMETYPE ? 'folder' : 'file'} ${item.name} (${item.id})`)

      // TODO: Remove previous watch if it exists
      const absoluteExpirationTimeMs: number = Date.now() + MAX_RESOURCE_WATCH_EXPIRATION_DELAY_MS
      await this._googleClient.files.watch({
        fileId: item.id,
        requestBody: {
          id: uuidv4(),
          type: 'web_hook',
          address: `${process.env.BP_WEBHOOK_URL}/${this._ctx.webhookId}`,
          token: item.id,
          expiration: absoluteExpirationTimeMs.toString(),
        },
      })
    })
  }

  public async watchAllFiles() {
    await this._watchAllItems(this._listBaseFiles.bind(this))
  }

  public async watchAllFolders() {
    await this._watchAllItems(this._listBaseFolders.bind(this))
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFileFromBaseFile(file: BaseNormalFile): Promise<File> {
    const genericFile = convertNormalFileToGeneric(file)
    await this._getOrFetchParents(genericFile)
    const { id, mimeType, name, parentId, size } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      size,
      path: this._getFilePath(id),
    }
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFolderFromBaseFolder(file: BaseFolderFile): Promise<Folder> {
    const genericFile = convertFolderFileToGeneric(file)
    await this._getOrFetchParents(genericFile)
    const { id, mimeType, name, parentId } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      path: this._getFilePath(id),
    }
  }

  private async _fetchFiles({ nextToken, searchQuery }: { nextToken?: string; searchQuery?: string }): Promise<{
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
      this._filesCache.set(newFile)
    }

    return {
      newFiles,
      newNextToken,
    }
  }

  private _getOrFetchParents = async (file: BaseGenericFile): Promise<BaseGenericFile[]> => {
    this._filesCache.set(file) // Set if not already set

    const { parentId } = file
    if (!parentId) {
      return []
    }

    let parent = this._filesCache.find(parentId)
    if (!parent) {
      parent = await this._fetchFile(parentId)
    }
    const parents: BaseGenericFile[] = [parent]
    parents.push(...(await this._getOrFetchParents(parent)))
    return parents
  }

  private async _fetchFile(id: string): Promise<BaseGenericFile> {
    let file = this._filesCache.find(id)
    if (!file) {
      const response = await this._googleClient.files.get({
        fileId: id,
        fields: GOOGLE_API_FILE_FIELDS,
      })
      file = parseGenericFile(response.data)
    }
    this._filesCache.set(file)
    return file
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

    const indexableContentType = INDEXABLE_MIMETYPES.find((type) => exportContentTypes.includes(type))
    const defaultContentType = exportContentTypes[0]
    return indexableContentType ?? defaultContentType
  }

  private _getFilePath = (id: string): string[] => {
    const file = this._filesCache.get(id)
    if (!file.parentId) {
      return [file.name]
    }

    return [...this._getFilePath(file.parentId), file.name]
  }
}
