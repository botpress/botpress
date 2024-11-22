import { z } from '@botpress/sdk'
import { fileChannelSchema } from './schemas'
import { FileChannel } from './types'
import * as bp from '.botpress'

const fileChannelsSchema = z.record(z.string(), fileChannelSchema)
type FileChannels = z.infer<typeof fileChannelsSchema>
type FileChannelsArray = FileChannel[]
export class FileChannelsCache {
  private _channels: FileChannels

  public constructor(private _client: bp.Client, private _ctx: bp.Context, private _logger: bp.Logger) {
    this._channels = FileChannelsCache._getEmpty()
  }

  public clear() {
    this._channels = FileChannelsCache._getEmpty()
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
    const fileChannels = new FileChannelsCache(client, ctx, logger)
    fileChannels._channels = fileChannels._deserializeChannels(serializedChannels) ?? this._getEmpty()
    return fileChannels
  }

  public async save() {
    return await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesChannels',
      payload: {
        filesChannels: FileChannelsCache._serializeChannels(this._channels),
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
    return {}
  }

  public remove(fileId: string): FileChannel | undefined {
    const channel = this._channels[fileId]
    delete this._channels[fileId]
    return channel
  }

  /**
   * @returns Channel that was replaced
   */
  public set(channel: FileChannel): FileChannel | undefined {
    const oldChannel = this._channels[channel.fileId]
    this._channels[channel.fileId] = channel
    return oldChannel
  }

  /**
   * @returns Channels that were replaced
   */
  public setAll(channels: FileChannelsArray): FileChannelsArray {
    const newChannels = Object.fromEntries(channels.map((channel) => [channel.fileId, channel]))
    const oldChannels = { ...this._channels }
    this._channels = newChannels
    return Object.values(oldChannels)
  }

  public getAll(): FileChannelsArray {
    return Object.values(this._channels)
  }
}
