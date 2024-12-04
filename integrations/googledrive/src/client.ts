import { RuntimeError } from '@botpress/sdk'
import { Readable, Stream } from 'stream'
import { v4 as uuidv4 } from 'uuid'
import { getAuthenticatedGoogleClient } from './auth'
import { handleNotFoundError, handleRateLimitError } from './error-handling'
import { serializeToken } from './file-notification-token'
import { FilesCache } from './files-cache'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE, INDEXABLE_MIMETYPES } from './mime-types'
import {
  BaseDiscriminatedFile,
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
  BaseGenericFileUnion,
  FileChannel,
  GenericFile,
} from './types'
import { listItemsAndProcess, ListFunction, streamToBuffer, ListItemsInputWithArgs, listAllItems } from './utils'
import {
  getFileTypeFromMimeType,
  parseChannel,
  parseBaseGeneric,
  parseBaseGenerics,
  parseBaseNormal,
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
type TryWatchAllOutput = {
  fileChannels: FileChannel[]
  hasError: boolean
}

const MAX_RESOURCE_WATCH_EXPIRATION_DELAY_MS = 86400 * 1000 // 24 hours
const MAX_EXPORT_FILE_SIZE_BYTES = 10000000 // 10MB, as per the Google Drive API doc
const MYDRIVE_ID_ALIAS = 'root'
const PAGE_SIZE = 10
const GOOGLE_API_EXPORTFORMATS_FIELDS = 'exportFormats'
const GOOGLE_API_FILE_FIELDS = 'id, name, mimeType, parents, size'
const GOOGLE_API_FILELIST_FIELDS = `files(${GOOGLE_API_FILE_FIELDS}), nextPageToken`
export class Client {
  private constructor(
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
    const filesCache = new FilesCache(client, ctx)
    return new Client(ctx, googleClient, filesCache, logger)
  }

  public setCache(filesCache: FilesCache) {
    this._filesCache = filesCache
  }

  public async listFiles({ nextToken }: ListItemsInput): Promise<ListFilesOutput> {
    const { items: baseFiles, meta } = await this._listBaseNormalFiles({ nextToken })
    const completeFilesPromises = baseFiles.map((f) => this._getCompleteFileFromBaseFile(f))
    const items = await Promise.all(completeFilesPromises)
    return {
      items,
      meta,
    }
  }

  private async _listBaseNormalFiles({ nextToken }: ListItemsInput): Promise<ListItemsOutput<BaseNormalFile>> {
    const {
      items: newFiles,
      meta: { nextToken: newNextToken },
    } = await this._listBaseGenericFiles({
      nextToken,
      args: {
        searchQuery: `mimeType != '${APP_GOOGLE_FOLDER_MIMETYPE}' and mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`,
      },
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
    const { items: baseFolders, meta } = await this._listBaseFolderFiles({ nextToken })

    const completeFoldersPromises = baseFolders.map((f) => this._getCompleteFolderFromBaseFolder(f))
    const items = await Promise.all(completeFoldersPromises)
    return {
      items,
      meta,
    }
  }

  private async _listBaseFolderFiles({ nextToken }: ListItemsInput): Promise<ListItemsOutput<BaseFolderFile>> {
    const {
      items: newFiles,
      meta: { nextToken: newNextToken },
    } = await this._listBaseGenericFiles({
      nextToken,
      args: {
        searchQuery: `mimeType = '${APP_GOOGLE_FOLDER_MIMETYPE}'`,
      },
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

  public async getChildren(folderId: string): Promise<GenericFile[]> {
    const files = await listAllItems(this._listBaseGenericFiles.bind(this), {
      searchQuery: `'${folderId}' in parents`,
    })
    return await Promise.all(files.map((f) => this._getCompleteFile(f)))
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
    const file = parseBaseNormal(response.data)
    this._filesCache.set({ type: 'normal', ...file })
    return await this._getCompleteFileFromBaseFile(file)
  }

  public async readGenericFile(id: string): Promise<GenericFile> {
    const file = await this._fetchFile(id)
    return await this._getCompleteFile(file)
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
    const file = parseBaseNormal(response.data)
    this._filesCache.set({ type: 'normal', ...file })
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

  private _getRateLimitErrorHandler(): (error: unknown) => Promise<undefined> {
    return async (error: unknown) => {
      return handleRateLimitError(error, this._logger)
    }
  }

  private _getNotFoundErrorHandler(): (error: unknown) => Promise<undefined> {
    return async (error: unknown) => {
      return handleNotFoundError(error, this._logger)
    }
  }

  private async _tryWatchAllListableGenericFiles<T extends BaseGenericFileUnion>(
    listFn: ListFunction<T>
  ): Promise<TryWatchAllOutput> {
    const fileChannels: FileChannel[] = []
    let hasError = false
    await listItemsAndProcess(listFn, async (item) => {
      const channel = await this._watch(item).catch(this._getRateLimitErrorHandler())
      if (channel) {
        fileChannels.push(channel)
      } else {
        hasError = true
      }
    })
    return {
      fileChannels,
      hasError,
    }
  }

  public async watch(id: string): Promise<FileChannel> {
    const file = await this._fetchFile(id)
    return await this._watch(file)
  }

  /**
   * @returns Channel if successful, undefined if the subscription rate limit is exceeded
   */
  public async tryWatch(id: string): Promise<FileChannel | undefined> {
    return await this.watch(id).catch(this._getRateLimitErrorHandler())
  }

  private async _watch(file: BaseGenericFileUnion): Promise<FileChannel> {
    const absoluteExpirationTimeMs: number = Date.now() + MAX_RESOURCE_WATCH_EXPIRATION_DELAY_MS
    const { id: fileId, mimeType } = file
    const token = serializeToken(
      {
        fileId,
        fileType: getFileTypeFromMimeType(mimeType),
      },
      bp.secrets.WEBHOOK_SECRET
    )
    const response = await this._googleClient.files.watch({
      fileId,
      requestBody: {
        id: uuidv4(),
        type: 'web_hook',
        address: `${process.env.BP_WEBHOOK_URL}/${this._ctx.webhookId}`,
        token,
        expiration: absoluteExpirationTimeMs.toString(),
      },
    })
    const baseChannel = parseChannel(response.data)
    this._logger.forBot().debug(`Watching file '${file.name}' (${file.id}): channel ID = ${baseChannel.id}`)
    return {
      ...baseChannel,
      fileId,
    }
  }

  public async tryWatchAllFiles(): Promise<TryWatchAllOutput> {
    return await this._tryWatchAllListableGenericFiles(this._listBaseNormalFiles.bind(this))
  }

  public async tryWatchAllFolders(): Promise<TryWatchAllOutput> {
    return await this._tryWatchAllListableGenericFiles(this._listBaseFolderFiles.bind(this))
  }

  public async tryWatchAll(): Promise<TryWatchAllOutput> {
    const [filesResult, foldersResult] = await Promise.all([this.tryWatchAllFiles(), this.tryWatchAllFolders()])
    return {
      fileChannels: [...filesResult.fileChannels, ...foldersResult.fileChannels],
      hasError: filesResult.hasError || foldersResult.hasError,
    }
  }

  public async unwatch(channels: FileChannel | FileChannel[]) {
    if (!Array.isArray(channels)) {
      channels = [channels]
    }
    const unwatchPromises = channels.map((channel) => {
      const fileName = this._filesCache.find(channel.fileId)?.name ?? '[unknown]'
      this._logger.forBot().debug(`Unwatching file ${fileName} (${channel.fileId}) with channel ID = ${channel.id}`)
      const { id, resourceId } = channel
      return this._googleClient.channels.stop({
        requestBody: {
          id,
          resourceId,
        },
      })
    })
    await Promise.all(unwatchPromises)
  }

  public async tryUnwatch(channels: FileChannel | FileChannel[]) {
    await this.unwatch(channels).catch(this._getNotFoundErrorHandler())
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
      path: await this._getFilePath({ type: 'normal', ...file }),
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
      path: await this._getFilePath({ type: 'folder', ...file }),
    }
  }

  private async _getCompleteFile(file: BaseDiscriminatedFile): Promise<GenericFile> {
    return {
      ...file,
      path: await this._getFilePath(file),
    }
  }

  private async _listBaseGenericFiles({
    nextToken,
    args,
  }: ListItemsInputWithArgs<{ searchQuery?: string }>): Promise<ListItemsOutput<BaseDiscriminatedFile>> {
    const searchQuery = args?.searchQuery
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
    const newFiles = parseBaseGenerics(unvalidatedDriveFiles)
    for (const newFile of newFiles) {
      this._filesCache.set(newFile)
    }

    return {
      items: newFiles,
      meta: {
        nextToken: newNextToken,
      },
    }
  }

  private async _getOrFetchFile(id: string): Promise<BaseDiscriminatedFile> {
    let file = this._filesCache.find(id)
    if (!file) {
      file = await this._fetchFile(id)
    }
    return file
  }

  private async _fetchFile(id: string): Promise<BaseDiscriminatedFile> {
    const response = await this._googleClient.files.get({
      fileId: id,
      fields: GOOGLE_API_FILE_FIELDS,
    })
    const file = parseBaseGeneric(response.data)
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

  private _getFilePath = async (file: BaseDiscriminatedFile): Promise<string[]> => {
    if (!file.parentId) {
      return [file.name]
    }

    const parent = await this._getOrFetchFile(file.parentId)
    return [...(await this._getFilePath(parent)), file.name]
  }
}
