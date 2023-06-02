import { compile } from 'json-schema-to-typescript'
import { Module } from './module'
import type * as types from './typings'

export class ConfigurationModule extends Module {
  public static async create(configuration: types.Config): Promise<ConfigurationModule> {
    const schema = configuration.schema ?? {}
    const filename = 'configuration'
    return new ConfigurationModule({
      path: `${filename}.ts`,
      exportName: 'Configuration',
      content: await compile(schema, filename),
    })
  }
}
