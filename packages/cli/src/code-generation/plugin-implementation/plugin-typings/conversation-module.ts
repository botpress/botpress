import * as sdk from '@botpress/sdk'
import { INDEX_FILE } from '../../consts'
import * as consts from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'

export class ConversationModule extends Module {
  public constructor(private _conversation: sdk.PluginDefinition['conversation']) {
    const name = 'conversation'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    const conversation = { tags: this._conversation?.tags ?? {} }

    return [
      consts.GENERATED_HEADER,
      `export type ${this.exportName} = {`,
      `  tags: ${stringifySingleLine(conversation.tags)}`,
      '}',
    ].join('\n')
  }
}
