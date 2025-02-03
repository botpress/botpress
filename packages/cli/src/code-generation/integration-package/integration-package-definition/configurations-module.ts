import { JSONSchema7 } from 'json-schema'
import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class ConfigurationModule extends Module {
  public constructor(
    name: string,
    private _configuration: types.ConfigurationDefinition
  ) {
    const configurationName = name
    const exportName = strings.varName(`${configurationName}Config`)
    super({
      path: `${name}.ts`,
      exportName,
    })
  }

  public async getContent() {
    const schema: JSONSchema7 = this._configuration.schema ?? { type: 'object', properties: {} }
    return jsonSchemaToTypescriptZuiSchema(
      schema,
      this.exportName,
      gen.primitiveRecordToTypescriptValues({
        title: this._configuration.title,
        description: this._configuration.description,
      })
    )
  }
}

export class ConfigurationsModule extends ReExportVariableModule {
  public constructor(configurations: Record<string, types.ConfigurationDefinition>) {
    super({ exportName: strings.varName('configurations') })
    for (const [configurationName, configuration] of Object.entries(configurations)) {
      const module = new ConfigurationModule(configurationName, configuration)
      this.pushDep(module)
    }
  }
}
