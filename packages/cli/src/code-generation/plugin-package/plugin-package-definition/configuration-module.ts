import { INDEX_FILE } from '../../consts'
import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class DefaultConfigurationModule extends Module {
  public constructor(private _configuration: types.ApiConfigurationDefinition) {
    const name = 'configuration'
    const exportName = strings.varName(name)
    super({
      path: INDEX_FILE,
      exportName,
    })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._configuration.schema, this.exportName)
  }
}
