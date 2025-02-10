import { JSONSchema7 } from 'json-schema'
import { INDEX_FILE } from '../../consts'
import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import * as gen from '../../generators'
import { Module } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class DefaultConfigurationModule extends Module {
  public constructor(private _configuration: types.ConfigurationDefinition) {
    const name = 'configuration'
    const exportName = strings.varName(name)
    super({
      path: INDEX_FILE,
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
