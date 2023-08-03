import bluebird from 'bluebird'
import { casing } from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import type * as types from '../typings'

export class MessageModule extends Module {
  public static async create(name: string, message: types.MessageDefinition): Promise<MessageModule> {
    const schema = message.schema ?? {}
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await jsonSchemaToTypeScriptType(schema, name),
    }
    return new MessageModule(def)
  }
}

export class ChannelModule extends ReExportTypeModule {
  public static async create(channelName: string, channel: types.ChannelDefinition): Promise<ChannelModule> {
    const messages = channel.messages ?? {}
    const messageModules = await bluebird.map(Object.entries(messages), ([messageName, message]) =>
      MessageModule.create(messageName, message)
    )

    const inst = new ChannelModule({
      exportName: `Channel${casing.to.pascalCase(channelName)}`,
    })
    inst.pushDep(...messageModules)
    return inst
  }
}

export class ChannelsModule extends ReExportTypeModule {
  public static async create(channels: Record<string, types.ChannelDefinition>): Promise<ChannelsModule> {
    const channelModules = await bluebird.map(Object.entries(channels), async ([channelName, channel]) => {
      const mod = await ChannelModule.create(channelName, channel)
      return mod.unshift(channelName)
    })
    const inst = new ChannelsModule({ exportName: 'Channels' })
    inst.pushDep(...channelModules)
    return inst
  }
}
