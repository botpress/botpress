import { INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import * as strings from '../strings'
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

    const exportName = strings.typeName(name)
    return new ConfigurationModule({
      path: INDEX_FILE,
      exportName,
      content: await jsonSchemaToTypeScriptType(schema, exportName),
    })
  }
}
