import { z } from '@botpress/sdk'
import { fileChannelSchema } from './schemas'
import * as bp from '.botpress'

const fileChannelsSchema = z.array(fileChannelSchema)
type FileChannels = z.infer<typeof fileChannelsSchema>
export class FileChannelsStore {
  private _channels: FileChannels

  public constructor(private _client: bp.Client, private _ctx: bp.Context, private _logger: bp.Logger) {
    this._channels = FileChannelsStore._getEmpty()
  }

  public clear() {
    this._channels = FileChannelsStore._getEmpty()
  }

  public static async load({ client, ctx, logger }: { client: bp.Client; ctx: bp.Context; logger: bp.Logger }) {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'filesChannels',
      payload: {
        filesChannels: this._serializeChannels(this._getEmpty()),
      },
    })
    const serializedChannels = getStateResponse.state.payload.filesChannels
    const fileChannels = new FileChannelsStore(client, ctx, logger)
    fileChannels._channels = fileChannels._deserializeChannels(serializedChannels) ?? this._getEmpty()
    return fileChannels
  }

  public async save() {
    return await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesChannels',
      payload: {
        filesChannels: FileChannelsStore._serializeChannels(this._channels),
      },
    })
  }

  private static _serializeChannels(channels: FileChannels): string {
    return JSON.stringify(channels)
  }

  private _deserializeChannels(serializedChannels: string): FileChannels | undefined {
    let deserializedObject
    try {
      deserializedObject = JSON.parse(serializedChannels)
    } catch (e) {
      this._logger.forBot().error(`Error parsing files channels JSON: ${e}`)
      return undefined
    }

    const parseResult = fileChannelsSchema.safeParse(deserializedObject)
    if (parseResult.error) {
      this._logger.forBot().error(`Error parsing files channels Object: ${parseResult.error.toString()}`)
      return undefined
    }
    return parseResult.data
  }

  private static _getEmpty(): FileChannels {
    return []
  }

  /**
   * @returns Channels that were replaced
   */
  public setAll(channels: FileChannels): FileChannels {
    const oldChannels = this._channels
    this._channels = [...channels]
    return oldChannels
  }

  public getAll(): FileChannels {
    return this._channels
  }
}
