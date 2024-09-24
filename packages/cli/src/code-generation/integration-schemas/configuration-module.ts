import { INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class DefaultConfigurationModule extends Module {
  public constructor(private _configuration: types.ConfigurationDefinition) {
    const name = 'configuration'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent(): Promise<string> {
    const { schema } = this._configuration
    if (!schema) {
      return [
        '/** Default Configuration of the Integration */',
        'export type Configuration = Record<string, never>;',
      ].join('\n')
    }
    return await jsonSchemaToTypeScriptType(schema, this.exportName)
  }
}
