import { RuntimeError, z } from '@botpress/sdk'
import { baseGenericFileSchema } from './schemas'
import { BaseFolderFile, BaseGenericFile, BaseNormalFile } from './types'
import * as bp from '.botpress'

const filesMapSchema = z.record(z.string(), baseGenericFileSchema)
type FilesMap = z.infer<typeof filesMapSchema>

export class FilesCache {
  private _map: FilesMap
  public constructor(private _client: bp.Client, private _ctx: bp.Context, private _logger: bp.Logger) {
    this._map = {}
  }

  public clear() {
    this._map = {}
  }

  public static async load({
    client,
    ctx,
    logger,
  }: {
    client: bp.Client
    ctx: bp.Context
    logger: bp.Logger
  }): Promise<FilesCache> {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'filesCache',
      payload: {
        filesCache: this._serializeMap({}),
      },
    })
    const cache = new FilesCache(client, ctx, logger)
    cache._map = cache._deserializeMap(getStateResponse.state.payload.filesCache) ?? {}
    return cache
  }

  public async save() {
    await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesCache',
      payload: {
        filesCache: FilesCache._serializeMap(this._map),
      },
    })
  }

  private static _serializeMap(map: FilesMap): string {
    return JSON.stringify(map)
  }

  private _deserializeMap(serializedMap: string): FilesMap | undefined {
    let deserializedObject = undefined
    try {
      deserializedObject = JSON.parse(serializedMap)
    } catch (e) {
      this._logger.forBot().error(`Error parsing files cache JSON: ${e}`)
      return undefined
    }

    const parseResult = filesMapSchema.safeParse(deserializedObject)
    if (parseResult.error) {
      this._logger.forBot().error(`Error parsing files cache Object: ${parseResult.error.toString()}`)
      return undefined
    }
    return parseResult.data
  }

  public find(id: string): BaseGenericFile | undefined {
    return this._map[id]
  }

  public set(file: BaseGenericFile) {
    this._map[file.id] = file
  }

  public remove(id: string) {
    delete this._map[id]
  }

  private _getGenericFile(id: string): BaseGenericFile {
    const file = this._map[id]
    if (!file) {
      throw new RuntimeError(`Couldn't get file from files map with ID=${id}`)
    }
    return file
  }

  public get(id: string): BaseGenericFile {
    return this._getGenericFile(id)
  }

  public getAll(filterFn?: (file: BaseGenericFile) => boolean): BaseGenericFile[] {
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
