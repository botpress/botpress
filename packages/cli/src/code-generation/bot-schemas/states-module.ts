import * as sdk from '@botpress/sdk'
import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'

type BotStateDefinition = NonNullable<sdk.BotDefinition['states']>[string]
export class StateModule extends Module {
  public constructor(name: string, private _state: BotStateDefinition) {
    super({
      path: `${name}.ts`,
      exportName: strings.typeName(name),
    })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._state)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class StatesModule extends ReExportTypeModule {
  public constructor(states: Record<string, BotStateDefinition>) {
    super({
      exportName: strings.typeName('states'),
    })
    const stateModules = Object.entries(states).map(([stateName, state]) => new StateModule(stateName, state))
    this.pushDep(...stateModules)
  }
}
