import { INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const { schema } = configuration
    if (!schema) {
      return new ConfigurationModule({
        path: INDEX_FILE,
        exportName: 'Configuration',
        content: 'export type Configuration = Record<string, never>;',
      })
    }

    const name = 'configuration'
    return new ConfigurationModule({
      path: INDEX_FILE,
      exportName: 'Configuration',
      content: await jsonSchemaToTypeScriptType(schema, name),
    })
  }
}
