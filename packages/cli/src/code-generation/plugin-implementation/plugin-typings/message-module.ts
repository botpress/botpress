import * as sdk from '@botpress/sdk'
import { INDEX_FILE } from '../../consts'
import * as consts from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'

export class MessageModule extends Module {
  public constructor(private _message: sdk.PluginDefinition['message']) {
    const name = 'message'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    const message = { tags: this._message?.tags ?? {} }

    return [
      consts.GENERATED_HEADER,
      `export type ${this.exportName} = {`,
      `  tags: ${stringifySingleLine(message.tags)}`,
      '}',
    ].join('\n')
  }
}
