import { jsonSchemaToZod as compile } from 'json-schema-to-zod'
import { Module } from '../module'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const schema = configuration.schema ?? {}
    const name = 'configuration'
    return new ConfigurationModule({
      path: `${name}.ts`,
      exportName: 'configuration',
      content: compile(schema, { name }),
    })
  }
}
