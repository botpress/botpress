import { RuntimeError, z } from '@botpress/sdk'
import { baseGenericFileSchema } from './schemas'
import { BaseFolderFile, BaseGenericFile, BaseNormalFile } from './types'
import * as bp from '.botpress'

const filesMapImplSchema = z.record(z.string(), baseGenericFileSchema)
type FilesMapImpl = z.infer<typeof filesMapImplSchema>

export class FilesMap {
  private _cachedMap: FilesMapImpl
  public constructor(private _client: bp.Client, private _ctx: bp.Context) {
    this._cachedMap = {}
  }

  public static async load({ client, ctx }: { client: bp.Client; ctx: bp.Context }): Promise<FilesMap> {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'list',
      payload: {
        filesMap: JSON.stringify({}),
      },
    })
    const parseResult = filesMapImplSchema.safeParse(JSON.parse(getStateResponse.state.payload.filesMap))
    if (parseResult.error) {
      throw new RuntimeError(`Error parsing saved files map: ${parseResult.error.message}`)
    }
    const cachedMap = parseResult.data
    const map = new FilesMap(client, ctx)
    map._cachedMap = cachedMap
    return map
  }

  public async save() {
    await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'list',
      payload: {
        filesMap: JSON.stringify(this._cachedMap),
      },
    })
  }

  public has(id: string): boolean {
    return this._cachedMap[id] !== undefined
  }

  public set(file: BaseGenericFile) {
    this._cachedMap[file.id] = file
  }

  private _getGenericFile(id: string): BaseGenericFile {
    const file = this._cachedMap[id]
    if (!file) {
      throw new RuntimeError(`Couldn't get file from files map with ID=${id}`)
    }
    return file
  }

  public get(id: string): BaseGenericFile {
    return this._getGenericFile(id)
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
   * @throws {RuntimeError} ID must correspond to a file compatible with FolderNormalFile
   */
  public getFolder(id: string): BaseFolderFile {
    const file = this._getGenericFile(id)
    if (file.type !== 'folder') {
      throw new RuntimeError(`Attempted to get file with ID=${file.id} as a normal file but is type ${file.type}`)
    }
    return file
  }
}
