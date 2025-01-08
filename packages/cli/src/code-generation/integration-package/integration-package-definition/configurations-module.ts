import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class ConfigurationModule extends Module {
  public constructor(name: string, private _configuration: types.ApiConfigurationDefinition) {
    const configurationName = name
    const exportName = strings.varName(`${configurationName}Config`)
    super({
      path: `${name}.ts`,
      exportName,
    })
  }

  public async getContent() {
    const { schema } = this._configuration
    if (!schema) {
      return `export const ${this.exportName} = z.object({});`
    }
    return jsonSchemaToTypescriptZuiSchema(schema, this.exportName)
  }
}

export class ConfigurationsModule extends ReExportVariableModule {
  public constructor(configurations: Record<string, types.ApiConfigurationDefinition>) {
    super({ exportName: strings.varName('configurations') })
    for (const [configurationName, configuration] of Object.entries(configurations)) {
      const module = new ConfigurationModule(configurationName, configuration)
      this.pushDep(module)
    }
  }
}
