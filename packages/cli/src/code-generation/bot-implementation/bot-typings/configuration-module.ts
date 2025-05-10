import * as sdk from '@botpress/sdk'
import { INDEX_FILE } from '../../consts'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'

export class ConfigurationModule extends Module {
  public constructor(private _configuration: sdk.BotConfigurationDefinition | undefined) {
    const name = 'configuration'
    const exportName = strings.typeName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    const configurationSchema: sdk.ZuiObjectSchema = this._configuration?.schema ?? sdk.z.object({})
    return zuiSchemaToTypeScriptType(configurationSchema, this.exportName)
  }
}
