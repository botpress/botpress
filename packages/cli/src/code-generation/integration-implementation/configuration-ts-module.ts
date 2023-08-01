import { jsonSchemaToTypeScriptType } from '../generators'
import { Module } from '../module'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const schema = configuration.schema ?? {}
    const name = 'configuration'
    return new ConfigurationModule({
      path: `${name}.ts`,
      exportName: 'Configuration',
      content: await jsonSchemaToTypeScriptType(schema, name),
    })
  }
}
