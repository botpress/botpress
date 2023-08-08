import { INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const schema = configuration.schema
    const name = 'configuration'
    return new ConfigurationModule({
      path: INDEX_FILE,
      exportName: 'Configuration',
      content: await jsonSchemaToTypeScriptType(schema, name),
    })
  }
}
