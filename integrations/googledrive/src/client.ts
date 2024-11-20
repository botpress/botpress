import { RuntimeError } from '@botpress/sdk'
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
  ListItemsInput,
  ListItemsOutput,
  NonDiscriminatedGenericFile,
  FileChannel,
} from './types'
import { listItemsAndProcess, ListFunction, streamToBuffer } from './utils'
import {
  convertFolderFileToGeneric,
  convertNormalFileToGeneric,
  parseChannel,
  parseGenericFile,
  parseGenericFiles,
  parseNormalFile,
} from './validation'
import * as bp from '.botpress'

type DownloadFileDataClientOutput = {
  mimeType: string
  dataSize: number
} & (
  | {
      dataType: 'buffer'
      data: Buffer
    }
  | {
      dataType: 'stream'
      data: Readable
    }
)

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
    const filesCache = new FilesCache(client, ctx, logger)
    return new Client(client, ctx, googleClient, filesCache, logger)
  }

  public setCache(filesCache: FilesCache) {
    this._filesCache = filesCache
  }

  public async listFiles({ nextToken }: ListItemsInput): Promise<ListFilesOutput> {
    const { items: baseFiles, meta } = await this._listBaseFiles({ nextToken })
    const completeFilesPromises = baseFiles.map((f) => this._getCompleteFileFromBaseFile(f))
    const items = await Promise.all(completeFilesPromises)
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
    const { items: baseFolders, meta } = await this._listBaseFolders({ nextToken })

    const completeFoldersPromises = baseFolders.map((f) => this._getCompleteFolderFromBaseFolder(f))
    const items = await Promise.all(completeFoldersPromises)
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
    this._filesCache.set(convertNormalFileToGeneric(file))
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async readFile(id: string): Promise<File> {
    const file = await this._fetchFile(id)
    if (file.type !== 'normal') {
      throw new RuntimeError(`Attempted to read a file of type ${file.type}`)
    }
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
    this._filesCache.set(convertNormalFileToGeneric(file))
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async deleteFile(id: string) {
    await this._googleClient.files.delete({
      fileId: id,
    })
  }

  public async uploadFileData({ id, mimeType, data }: { id: string; mimeType?: string; data: Stream }) {
    await this._googleClient.files.update({
      fileId: id,
      media: {
        body: data,
        mimeType,
      },
    })
  }

  public async downloadFileData({ id }: { id: string }): Promise<DownloadFileDataClientOutput> {
    const file = await this._fetchFile(id)
    if (file.type !== 'normal') {
      throw new RuntimeError(`Attempted to download a file of type ${file.type}`)
    }

    const exportType = await this._findExportType(file.mimeType)
    let output: DownloadFileDataClientOutput
    if (exportType) {
      // File size is unknown when exporting, download all data to buffer to know size
      const fileDownloadStream = await this._exportFileData(file, exportType)
      const buffer = await streamToBuffer(fileDownloadStream, MAX_EXPORT_FILE_SIZE_BYTES)
      output = {
        mimeType: exportType,
        dataSize: buffer.length,
        dataType: 'buffer',
        data: buffer,
      }
    } else {
      output = {
        mimeType: file.mimeType,
        dataSize: file.size,
        dataType: 'stream',
        data: await this._fetchFileData(file),
      }
    }
    return output
  }

  private async _watchAllListableGenericFiles<T extends NonDiscriminatedGenericFile>(listFn: ListFunction<T>) {
    const channels: FileChannel[] = []
    await listItemsAndProcess(listFn, async (item) => {
      const absoluteExpirationTimeMs: number = Date.now() + MAX_RESOURCE_WATCH_EXPIRATION_DELAY_MS
      const repsonse = await this._googleClient.files.watch({
        fileId: item.id,
        requestBody: {
          id: uuidv4(),
          type: 'web_hook',
          address: `${process.env.BP_WEBHOOK_URL}/${this._ctx.webhookId}`,
          token: item.id, // TODO: Add secret to verify incoming notifications
          expiration: absoluteExpirationTimeMs.toString(),
        },
      })
      const channel = parseChannel(repsonse.data)
      this._logger.forBot().debug(`Watching file '${item.name}' (${item.id}): channel ID = ${channel.id}`)
      channels.push(channel)
    })
    return channels
  }

  public async watchAll(): Promise<FileChannel[]> {
    return [...(await this.watchAllFiles()), ...(await this.watchAllFolders())]
  }

  public async watchAllFiles(): Promise<FileChannel[]> {
    return await this._watchAllListableGenericFiles(this._listBaseFiles.bind(this))
  }

  public async watchAllFolders(): Promise<FileChannel[]> {
    return await this._watchAllListableGenericFiles(this._listBaseFolders.bind(this))
  }

  public async unwatch(channels: FileChannel | FileChannel[]) {
    if (!Array.isArray(channels)) {
      channels = [channels]
    }
    const unwatchPromises = channels.map((channel) => {
      this._logger.forBot().debug(`Unwatching file with channel ID = ${channel.id}`)
      return this._googleClient.channels.stop({ requestBody: channel })
    })
    await Promise.all(unwatchPromises)
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFileFromBaseFile(file: BaseNormalFile): Promise<File> {
    const { id, mimeType, name, parentId, size } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      size,
      path: await this._getFilePath(convertNormalFileToGeneric(file)),
    }
  }

  /**
   * Removes internal fields and adds computed attributes
   */
  private async _getCompleteFolderFromBaseFolder(file: BaseFolderFile): Promise<Folder> {
    const { id, mimeType, name, parentId } = file
    return {
      id,
      mimeType,
      name,
      parentId,
      path: await this._getFilePath(convertFolderFileToGeneric(file)),
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

  private async _getOrFetchFile(id: string): Promise<BaseGenericFile> {
    let file = this._filesCache.find(id)
    if (!file) {
      file = await this._fetchFile(id)
    }
    return file
  }

  private async _fetchFile(id: string): Promise<BaseGenericFile> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    const file = parseGenericFile(response.data)
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

  private _getFilePath = async (file: BaseGenericFile): Promise<string[]> => {
    if (!file.parentId) {
      return [file.name]
    }

    const parent = await this._getOrFetchFile(file.parentId)
    return [...(await this._getFilePath(parent)), file.name]
  }
}
