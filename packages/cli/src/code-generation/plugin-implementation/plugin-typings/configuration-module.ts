import * as sdk from '@botpress/sdk'
import { INDEX_FILE } from '../../consts'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'

export class DefaultConfigurationModule extends Module {
  public constructor(private _configuration: sdk.BotConfigurationDefinition | undefined) {
    const name = 'configuration'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    if (!this._configuration) {
      return ['/** Default Configuration of the Plugin */', 'export type Configuration = Record<string, never>;'].join(
        '\n'
      )
    }
    return zuiSchemaToTypeScriptType(this._configuration.schema, this.exportName)
  }
}
