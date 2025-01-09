import { RuntimeError, z } from '@botpress/sdk'
import { baseDiscriminatedFileSchema } from './schemas'
import { BaseFolderFile, BaseDiscriminatedFile, BaseNormalFile } from './types'
import * as bp from '.botpress'

const _filesMapSchema = z.record(z.string(), baseDiscriminatedFileSchema)
type FilesMap = z.infer<typeof _filesMapSchema>

export class FilesCache {
  private _map: FilesMap
  public constructor(
    private _client: bp.Client,
    private _ctx: bp.Context
  ) {
    this._map = {}
  }

  public clear() {
    this._map = {}
  }

  public static async load({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<FilesCache> {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'filesCache',
      payload: {
        filesCache: FilesCache._getEmpty(),
      },
    })
    const cache = new FilesCache(client, ctx)
    cache._map = getStateResponse.state.payload.filesCache
    return cache
  }

  public async save() {
    await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesCache',
      payload: {
        filesCache: this._map,
      },
    })
  }

  private static _getEmpty(): FilesMap {
    return {}
  }

  public find(id: string): BaseDiscriminatedFile | undefined {
    return this._map[id]
  }

  public set(file: BaseDiscriminatedFile) {
    this._map[file.id] = file
  }

  public remove(id: string) {
    delete this._map[id]
  }

  private _getGenericFile(id: string): BaseDiscriminatedFile {
    const file = this._map[id]
    if (!file) {
      throw new RuntimeError(`Couldn't get file from files map with ID=${id}`)
    }
    return file
  }

  public get(id: string): BaseDiscriminatedFile {
    return this._getGenericFile(id)
  }

  public getAll(filterFn?: (file: BaseDiscriminatedFile) => boolean): BaseDiscriminatedFile[] {
    const allFiles = Object.values(this._map)
    return filterFn ? allFiles.filter(filterFn) : allFiles
  }

  /**
   * @throws {RuntimeError} ID must correspond to a file compatible with BaseNormalFile
   */
  public getFile(id: string): BaseNormalFile {
    const file = this._getGenericFile(id)
    if (file.type !== 'normal') {
      throw new RuntimeError(`Attempted to get file with ID=${file.id} as a normal file but is type ${file.type}`)
    }
    return file
  }

  /**
   * @throws {RuntimeError} ID must correspond to a file compatible with BaseFolderFile
   */
  public getFolder(id: string): BaseFolderFile {
    const file = this._getGenericFile(id)
    if (file.type !== 'folder') {
      throw new RuntimeError(`Attempted to get file with ID=${file.id} as a folder file but is type ${file.type}`)
    }
    return file
  }
}
