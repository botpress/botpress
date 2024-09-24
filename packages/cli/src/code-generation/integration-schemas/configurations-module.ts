import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class ConfigurationModule extends Module {
  public constructor(name: string, private _configuration: types.integration.ConfigurationDefinition) {
    const configurationName = name
    const exportName = strings.typeName(`${configurationName}Config`)
    super({
      path: `${name}.ts`,
      exportName,
    })
  }

  public async getContent(): Promise<string> {
    const { schema } = this._configuration
    if (!schema) {
      return `export type ${this.exportName} = Record<string, never>;`
    }
    const jsonSchema = utils.schema.mapZodToJsonSchema({ schema })
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class ConfigurationsModule extends ReExportTypeModule {
  public constructor(configurations: Record<string, types.integration.ConfigurationDefinition>) {
    super({ exportName: strings.typeName('configurations') })
    for (const [configurationName, configuration] of Object.entries(configurations)) {
      const module = new ConfigurationModule(configurationName, configuration)
      this.pushDep(module)
    }
  }
}
