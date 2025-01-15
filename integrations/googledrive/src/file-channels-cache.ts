import { z } from '@botpress/sdk'
import { fileChannelSchema } from './schemas'
import { FileChannel } from './types'
import * as bp from '.botpress'

const _fileChannelsSchema = z.record(z.string(), fileChannelSchema)
type FileChannels = z.infer<typeof _fileChannelsSchema>
type FileChannelsArray = FileChannel[]
export class FileChannelsCache {
  private _channels: FileChannels
  private _dirty = false

  public constructor(
    private _client: bp.Client,
    private _ctx: bp.Context
  ) {
    this._channels = FileChannelsCache._getEmpty()
  }

  public clear() {
    this._channels = FileChannelsCache._getEmpty()
    this._dirty = true
  }

  public static async load({ client, ctx }: { client: bp.Client; ctx: bp.Context }) {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'filesChannelsCache',
      payload: {
        filesChannelsCache: this._getEmpty(),
      },
    })
    const fileChannels = new FileChannelsCache(client, ctx)
    fileChannels._channels = getStateResponse.state.payload.filesChannelsCache
    fileChannels._dirty = false
    return fileChannels
  }

  public async save() {
    if (!this._dirty) {
      return
    }

    this._dirty = false
    return await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesChannelsCache',
      payload: {
        filesChannelsCache: this._channels,
      },
    })
  }

  private static _getEmpty(): FileChannels {
    return {}
  }

  public remove(fileId: string): FileChannel | undefined {
    const channel = this._channels[fileId]
    delete this._channels[fileId]
    this._dirty = true
    return channel
  }

  /**
   * @returns Channel that was replaced
   */
  public set(channel: FileChannel): FileChannel | undefined {
    const oldChannel = this._channels[channel.fileId]
    this._channels[channel.fileId] = channel
    this._dirty = true
    return oldChannel
  }

  /**
   * @returns Channels that were replaced
   */
  public setAll(channels: FileChannelsArray): FileChannelsArray {
    const newChannels = Object.fromEntries(channels.map((channel) => [channel.fileId, channel]))
    const oldChannels = { ...this._channels }
    this._channels = newChannels
    this._dirty = true
    return Object.values(oldChannels)
  }

  public getAll(): FileChannelsArray {
    return Object.values(this._channels)
  }
}
