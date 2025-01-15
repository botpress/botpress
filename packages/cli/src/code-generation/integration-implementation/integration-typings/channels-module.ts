import * as sdk from '@botpress/sdk'
import { GENERATED_HEADER, INDEX_FILE } from '../../consts'
import { zuiSchemaToTypeScriptType, stringifySingleLine } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

class MessageModule extends Module {
  public constructor(
    name: string,
    private _message: sdk.MessageDefinition
  ) {
    super({
      path: `${name}.ts`,
      exportName: strings.typeName(name),
    })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._message.schema, this.exportName)
  }
}

class MessagesModule extends ReExportTypeModule {
  public constructor(channel: sdk.ChannelDefinition) {
    super({ exportName: strings.typeName('messages') })
    for (const [messageName, message] of Object.entries(channel.messages ?? {})) {
      const module = new MessageModule(messageName, message)
      this.pushDep(module)
    }
  }
}

class ChannelModule extends Module {
  private _messagesModule: MessagesModule

  public constructor(
    channelName: string,
    private _channel: sdk.ChannelDefinition
  ) {
    super({
      path: INDEX_FILE,
      exportName: strings.typeName(channelName),
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
      `export type ${this.exportName} = {`,
      `  messages: ${this._messagesModule.exportName}`,
      `  message: ${stringifySingleLine(message)}`,
      `  conversation: ${stringifySingleLine(conversation)}`,
      '}',
    ].join('\n')
  }
}

export class ChannelsModule extends ReExportTypeModule {
  public constructor(channels: Record<string, sdk.ChannelDefinition>) {
    super({ exportName: strings.typeName('channels') })
    for (const [channelName, channel] of Object.entries(channels)) {
      const module = new ChannelModule(channelName, channel)
      module.unshift(channelName)
      this.pushDep(module)
    }
  }
}
