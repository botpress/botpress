import { INDEX_FILE } from '../const'
import { zuiSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class DefaultConfigurationModule extends Module {
  public constructor(private _configuration: types.integration.ConfigurationDefinition | undefined) {
    const name = 'configuration'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    if (!this._configuration) {
      return [
        '/** Default Configuration of the Integration */',
        'export type Configuration = Record<string, never>;',
      ].join('\n')
    }
    return zuiSchemaToTypeScriptType(this._configuration.schema, this.exportName)
  }
}
