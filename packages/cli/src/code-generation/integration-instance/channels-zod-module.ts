import bluebird from 'bluebird'
import { casing } from '../../utils'
import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptZod } from '../generators'
import { Module, ModuleDef, ReExportConstantModule } from '../module'
import { ReExportSchemaModule } from './schema-module'
import type * as types from './types'

export class MessageModule extends Module {
  public static async create(name: string, message: types.MessageDefinition): Promise<MessageModule> {
    const schema = message.schema ?? {}
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.camelCase(name),
      content: await jsonSchemaToTypeScriptZod(schema, name),
    }
    return new MessageModule(def)
  }
}

export class MessagesModule extends ReExportSchemaModule {
  public static async create(channelName: string, channel: types.ChannelDefinition): Promise<MessagesModule> {
    const messages = channel.messages ?? {}
    const messageModules = await bluebird.map(Object.entries(messages), ([messageName, message]) =>
      MessageModule.create(messageName, message)
    )

    const inst = new MessagesModule({
      exportName: `messages${casing.to.pascalCase(channelName)}`,
    })
    inst.pushDep(...messageModules)
    return inst
  }
}

export class ChannelModule extends Module {
  public static async create(channelName: string, channel: types.ChannelDefinition): Promise<ChannelModule> {
    const messages = await MessagesModule.create(channelName, channel)
    messages.unshift('messages')

    const inst = new ChannelModule(messages, channel, {
      exportName: `channel${casing.to.pascalCase(channelName)}`,
      path: INDEX_FILE,
      content: '',
    })

    inst.pushDep(messages)
    return inst
  }

  private constructor(
    private messages: MessagesModule,
    private channel: types.ChannelDefinition,
    private def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    const { messages, def, channel } = this

    const { conversation, message } = channel
    return [
      GENERATED_HEADER,
      `import { ${messages.exports} } from './${messages.import(this)}'`,
      '',
      `export const ${def.exportName} = {`,
      `  messages: ${messages.exports},`,
      `  message: ${this._stringify(message)},`,
      `  conversation: ${this._stringify(conversation)},`,
      '}',
    ].join('\n')
  }

  private _stringify(x: object): string {
    return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
  }
}

export class ChannelsModule extends ReExportConstantModule {
  public static async create(channels: Record<string, types.ChannelDefinition>): Promise<ChannelsModule> {
    const channelModules = await bluebird.map(Object.entries(channels), async ([channelName, channel]) => {
      const mod = await ChannelModule.create(channelName, channel)
      return mod.unshift(channelName)
    })
    const inst = new ChannelsModule({ exportName: 'channels' })
    inst.pushDep(...channelModules)
    return inst
  }
}
