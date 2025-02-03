import * as crypto from 'crypto'
import { Dropbox } from 'dropbox'
import { File as FileEntity, Folder as FolderEntity } from '../../definitions'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { ActionInput, RequestMapping, ResponseMapping } from './mapping'
import * as bp from '.botpress'

type File = FileEntity.InferredType
type Folder = FolderEntity.InferredType

export class DropboxClient {
  private static readonly _maxResultsPerPage = 100
  private readonly _dropboxRestClient: Dropbox

  private constructor(credentials: { accessToken: string; clientId: string; clientSecret: string }) {
    this._dropboxRestClient = new Dropbox(credentials)
  }

  public static async create({ ctx }: { client: bp.Client; ctx: bp.Context }) {
    return new DropboxClient({
      accessToken: ctx.configuration.accessToken,
      clientId: ctx.configuration.clientId,
      clientSecret: ctx.configuration.clientSecret,
    })
  }

  @handleErrors('Failed to validate Dropbox authentication')
  public async isProperlyAuthenticated(): Promise<boolean> {
    const nonce = crypto.randomUUID()
    const test = await this._dropboxRestClient.checkApp({
      query: nonce,
    })

    return test.status === 200 && test.result.result === nonce
  }

  @handleErrors('Failed to upload file')
  public async createFileFromText({
    dropboxPath,
    textContents,
  }: {
    dropboxPath: string
    textContents: string
  }): Promise<File> {
    const { result: newFile } = await this._dropboxRestClient.filesUpload({
      contents: textContents,
      path: dropboxPath,
    })

    return ResponseMapping.mapFile(newFile)
  }

  @handleErrors('Failed to list items in folder')
  public async listItemsInFolder({
    path,
    recursive,
    nextToken,
  }: {
    path: string
    recursive: boolean
    nextToken?: string
  }): Promise<{ items: (File | Folder)[]; nextToken?: string }> {
    const { result } = nextToken
      ? await this._dropboxRestClient.filesListFolderContinue({
          cursor: nextToken,
        })
      : await this._dropboxRestClient.filesListFolder({
          path,
          recursive,
          include_deleted: false,
          limit: DropboxClient._maxResultsPerPage,
        })

    return {
      items: result.entries.map(ResponseMapping.mapItem),
      nextToken: result.has_more ? result.cursor : undefined,
    }
  }

  @handleErrors('Failed to delete item')
  public async deleteItem({ path }: { path: string }): Promise<void> {
    await this._dropboxRestClient.filesDeleteV2({ path })
  }

  @handleErrors('Failed to download file')
  public async getFileContents({ path }: { path: string }): Promise<Buffer> {
    const { result } = await this._dropboxRestClient.filesDownload({ path })

    return this._castFileToBuffer(result)
  }

  @handleErrors('Failed to download folder')
  public async downloadFolder({ path }: { path: string }): Promise<Buffer> {
    const { result } = await this._dropboxRestClient.filesDownloadZip({ path })

    return this._castFileToBuffer(result)
  }

  private _castFileToBuffer(result: unknown): Buffer {
    // This method casts the result of a file download to the expected type.
    // For some reason, the Dropbox api documentation (and its sdk) is wrong:
    // what is actually returned is a { fileBinary: Buffer, fileBlob: Blob }
    // object, not a files.FileMetadata object. This has been the case for over
    // 7 years now, even though the developers are aware of the issue.
    // See https://www.dropboxforum.com/discussions/101000014/-/282827

    const castedResult = result as { fileBinary: Buffer }
    return castedResult.fileBinary
  }

  @handleErrors('Failed to create folder')
  public async createFolder({ path }: { path: string }): Promise<Folder> {
    const { result } = await this._dropboxRestClient.filesCreateFolderV2({ path })

    return ResponseMapping.mapFolder(result.metadata)
  }

  @handleErrors('Failed to copy item')
  public async copyItemToNewPath({ fromPath, toPath }: { fromPath: string; toPath: string }): Promise<File | Folder> {
    const { result } = await this._dropboxRestClient.filesCopyV2({ from_path: fromPath, to_path: toPath })

    return ResponseMapping.mapItem(result.metadata)
  }

  @handleErrors('Failed to move item')
  public async moveItemToNewPath({ fromPath, toPath }: { fromPath: string; toPath: string }): Promise<File | Folder> {
    const { result } = await this._dropboxRestClient.filesMoveV2({ from_path: fromPath, to_path: toPath })

    return ResponseMapping.mapItem(result.metadata)
  }

  @handleErrors('Failed to search items')
  public async searchItems(searchParams: ActionInput['searchItems']) {
    const { result } = searchParams.nextToken
      ? await this._dropboxRestClient.filesSearchContinueV2({ cursor: searchParams.nextToken })
      : await this._dropboxRestClient.filesSearchV2(
          RequestMapping.mapSearchItems(searchParams, DropboxClient._maxResultsPerPage)
        )

    return {
      results: result.matches.map(ResponseMapping.mapSearchMatch),
      nextToken: result.has_more ? result.cursor : undefined,
    }
  }
}
