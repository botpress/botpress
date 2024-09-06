import { INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class DefaultConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<DefaultConfigurationModule> {
    const { schema } = configuration
    if (!schema) {
      return new DefaultConfigurationModule({
        path: INDEX_FILE,
        exportName: 'Configuration',
        content: [
          '/** Default Configuration of the Integration */',
          'export type Configuration = Record<string, never>;',
        ].join('\n'),
      })
    }

    const name = 'configuration'

    const exportName = strings.typeName(name)
    return new DefaultConfigurationModule({
      path: INDEX_FILE,
      exportName,
      content: await jsonSchemaToTypeScriptType(schema, exportName),
    })
  }
}
