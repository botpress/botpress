import bluebird from 'bluebird'
import { casing } from '../../utils'
import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { stringifySingleLine, zodToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import type * as types from './types'

export class MessageModule extends Module {
  public static async create(name: string, message: types.MessageDefinition): Promise<MessageModule> {
    const schema = message.schema
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await zodToTypeScriptType(schema, name),
    }
    return new MessageModule(def)
  }
}

export class MessagesModule extends ReExportTypeModule {
  public static async create(channel: types.ChannelDefinition): Promise<MessagesModule> {
    const messages = channel.messages ?? {}
    const messageModules = await bluebird.map(Object.entries(messages), ([messageName, message]) =>
      MessageModule.create(messageName, message)
    )

    const inst = new MessagesModule({
      exportName: 'Messages',
    })
    inst.pushDep(...messageModules)
    return inst
  }
}

export class ChannelModule extends Module {
  public static async create(channelName: string, channel: types.ChannelDefinition): Promise<ChannelModule> {
    const messagesModule = await MessagesModule.create(channel)
    messagesModule.unshift('messages')

    const inst = new ChannelModule(messagesModule, channel, {
      path: INDEX_FILE,
      exportName: `Channel${casing.to.pascalCase(channelName)}`,
      content: '',
    })

    inst.pushDep(messagesModule)
    return inst
  }

  private constructor(private messageModules: MessageModule, private channel: types.ChannelDefinition, def: ModuleDef) {
    super(def)
  }

  public override get content() {
    const { messageModules } = this
    const messageImport = messageModules.import(this)

    const message = { tags: this.channel.message?.tags }
    const conversation = {
      tags: this.channel.conversation?.tags ?? {},
      creation: this.channel.conversation?.creation ?? { enabled: false, requiredTags: [] },
    }

    return [
      GENERATED_HEADER,
      `import { ${messageModules.exports} } from './${messageImport}'`,
      `export * from './${messageImport}'`,
      '',
      `export type ${this.exports} = {`,
      `  messages: ${messageModules.exports}`,
      `  message: ${stringifySingleLine(message)}`,
      `  conversation: ${stringifySingleLine(conversation)}`,
      '}',
    ].join('\n')
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
