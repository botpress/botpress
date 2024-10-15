import { GENERATED_HEADER, INDEX_FILE } from '../../consts'
import { jsonSchemaToTypescriptZuiSchema, stringifySingleLine } from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

class MessageModule extends Module {
  public constructor(name: string, private _message: types.ApiMessageDefinition) {
    super({
      path: `${name}.ts`,
      exportName: strings.varName(name),
    })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._message.schema, this.exportName)
  }
}

class MessagesModule extends ReExportVariableModule {
  public constructor(channel: types.ApiChannelDefinition) {
    super({ exportName: strings.varName('messages') })
    for (const [messageName, message] of Object.entries(channel.messages ?? {})) {
      const module = new MessageModule(messageName, message)
      this.pushDep(module)
    }
  }
}

class ChannelModule extends Module {
  private _messagesModule: MessagesModule

  public constructor(channelName: string, private _channel: types.ApiChannelDefinition) {
    super({
      path: INDEX_FILE,
      exportName: strings.varName(channelName),
    })

    this._messagesModule = new MessagesModule(_channel)
    this._messagesModule.unshift('messages')
    this.pushDep(this._messagesModule)
  }

  public async getContent() {
    const messageImport = this._messagesModule.import(this)

    const conversation = {
      tags: this._channel.conversation?.tags ?? {},
      creation: this._channel.conversation?.creation ?? { enabled: false, requiredTags: [] },
    }

    const message = {
      tags: this._channel.message?.tags ?? {},
    }

    return [
      GENERATED_HEADER,
      `import { ${this._messagesModule.exportName} } from './${messageImport}'`,
      `export * from './${messageImport}'`,
      '',
      `export const ${this.exportName} = {`,
      `  messages: ${this._messagesModule.exportName},`,
      `  message: ${stringifySingleLine(message)},`,
      `  conversation: ${stringifySingleLine(conversation)},`,
      '}',
    ].join('\n')
  }
}

export class ChannelsModule extends ReExportVariableModule {
  public constructor(channels: Record<string, types.ApiChannelDefinition>) {
    super({ exportName: strings.varName('channels') })
    for (const [channelName, channel] of Object.entries(channels)) {
      const module = new ChannelModule(channelName, channel)
      module.unshift(channelName)
      this.pushDep(module)
    }
  }
}
