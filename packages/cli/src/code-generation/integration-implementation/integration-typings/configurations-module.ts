import * as sdk from '@botpress/sdk'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

export class ConfigurationModule extends Module {
  public constructor(
    name: string,
    private _configuration: sdk.ConfigurationDefinition
  ) {
    const configurationName = name
    const exportName = strings.typeName(`${configurationName}Config`)
    super({
      path: `${name}.ts`,
      exportName,
    })
  }

  public async getContent() {
    const { schema } = this._configuration
    if (!schema) {
      return `export type ${this.exportName} = Record<string, never>;`
    }
    return zuiSchemaToTypeScriptType(schema, this.exportName)
  }
}

export class ConfigurationsModule extends ReExportTypeModule {
  public constructor(configurations: Record<string, sdk.ConfigurationDefinition>) {
    super({ exportName: strings.typeName('configurations') })
    for (const [configurationName, configuration] of Object.entries(configurations)) {
      const module = new ConfigurationModule(configurationName, configuration)
      this.pushDep(module)
    }
  }
}
