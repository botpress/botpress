import { z } from '@botpress/sdk'
import { fileChannelSchema } from './schemas'
import { FileChannel } from './types'
import * as bp from '.botpress'

const fileChannelsMapSchema = z.record(z.string().describe('File ID'), fileChannelSchema)
type FileChannelsMap = z.infer<typeof fileChannelsMapSchema>
const filesChannelsArray = z.array(fileChannelSchema)
type FileChannelsArray = z.infer<typeof filesChannelsArray>

// TODO: Extract loadable/saveable interface and implement with templated base storage class
export class FileChannelsStore {
  private _channelsMap: FileChannelsMap

  public constructor(private _client: bp.Client, private _ctx: bp.Context, private _logger: bp.Logger) {
    this._channelsMap = {}
  }

  public clear() {
    this._channelsMap = {}
  }

  public static async load({ client, ctx, logger }: { client: bp.Client; ctx: bp.Context; logger: bp.Logger }) {
    const getStateResponse = await client.getOrSetState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'filesChannels',
      payload: {
        filesChannels: this._serializeChannels({}),
      },
    })
    const fileChannels = new FileChannelsStore(client, ctx, logger)
    fileChannels._channelsMap = fileChannels._deserializeChannels(getStateResponse.state.payload.filesChannels) ?? {}
    return fileChannels
  }

  public async save() {
    return await this._client.setState({
      id: this._ctx.integrationId,
      type: 'integration',
      name: 'filesChannels',
      payload: {
        filesChannels: FileChannelsStore._serializeChannels(this._channelsMap),
      },
    })
  }

  private static _serializeChannels(channels: FileChannelsMap): string {
    return JSON.stringify(channels)
  }

  private _deserializeChannels(serializedChannels: string): FileChannelsMap | undefined {
    let deserializedObject
    try {
      deserializedObject = JSON.parse(serializedChannels)
    } catch (e) {
      this._logger.forBot().error(`Error parsing files channels JSON: ${e}`)
      return undefined
    }

    const parseResult = fileChannelsMapSchema.safeParse(deserializedObject)
    if (parseResult.error) {
      this._logger.forBot().error(`Error parsing files channels Object: ${parseResult.error.toString()}`)
      return undefined
    }
    return parseResult.data
  }

  public setAll(channels: FileChannelsArray): {
    updatedChannels: FileChannelsArray
    newChannels: FileChannelsArray
    deletedChannels: FileChannelsArray
  } {
    const newChannelsMap = new Map(channels.map((channel) => [channel.fileId, channel]))

    const updatedChannels: FileChannelsArray = []
    for (const newChannel of channels) {
      const oldChannel = this._channelsMap[newChannel.fileId]
      if (oldChannel !== undefined && oldChannel.id !== newChannel.id) {
        updatedChannels.push(newChannel)
      }
    }
    const newChannels = channels.filter((channel) => !this._channelsMap[channel.fileId])
    const deletedChannels = Array.from(Object.entries(this._channelsMap).map((entry) => entry[1])).filter(
      (channel) => !newChannelsMap.has(channel.fileId)
    )
    this._channelsMap = {}
    for (const newChannel of channels) {
      this._channelsMap[newChannel.fileId] = newChannel
    }
    return { updatedChannels, newChannels, deletedChannels }
  }

  public getAll(): FileChannelsArray {
    return Array.from(Object.entries(this._channelsMap).map((entry) => entry[1]))
  }

  public find(fileId: string): FileChannel | undefined {
    return this._channelsMap[fileId]
  }
}
