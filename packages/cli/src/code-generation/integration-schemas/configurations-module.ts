import bluebird from 'bluebird'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public static async create(name: string, configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const configurationName = name
    const schema = configuration.schema
    const exportName = strings.typeName(`${configurationName}Config`)

    let content: string
    if (schema) {
      content = await jsonSchemaToTypeScriptType(schema, exportName)
    } else {
      content = `export type ${exportName} = Record<string, never>;`
    }

    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName,
      content,
    }
    return new ConfigurationModule(def)
  }
}

export class ConfigurationsModule extends ReExportTypeModule {
  public static async create(
    configurations: Record<string, types.ConfigurationDefinition>
  ): Promise<ConfigurationsModule> {
    const configurationModules = await bluebird.map(
      Object.entries(configurations),
      async ([configurationName, configuration]) => ConfigurationModule.create(configurationName, configuration)
    )

    const inst = new ConfigurationsModule({
      exportName: strings.typeName('configurations'),
    })
    inst.pushDep(...configurationModules)
    return inst
  }
}
