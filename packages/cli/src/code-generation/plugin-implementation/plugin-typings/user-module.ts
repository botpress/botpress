import * as sdk from '@botpress/sdk'
import { INDEX_FILE } from '../../consts'
import * as consts from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'

export class UserModule extends Module {
  public constructor(private _user: sdk.PluginDefinition['user']) {
    const name = 'user'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    const user = { tags: this._user?.tags ?? {} }

    return [
      consts.GENERATED_HEADER,
      `export type ${this.exportName} = {`,
      `  tags: ${stringifySingleLine(user.tags)}`,
      '}',
    ].join('\n')
  }
}
