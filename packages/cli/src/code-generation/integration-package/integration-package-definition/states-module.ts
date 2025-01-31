import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class StateModule extends Module {
  public constructor(
    name: string,
    private _state: types.StateDefinition
  ) {
    super({
      path: `${name}.ts`,
      exportName: strings.varName(name),
    })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._state.schema, this.exportName, {
      type: `"${this._state.type}" as const`,
      ...gen.primitiveRecordToTypescriptValues({
        title: this._state.title,
        description: this._state.description,
      }),
    })
  }
}

export class StatesModule extends ReExportVariableModule {
  public constructor(states: Record<string, types.StateDefinition>) {
    super({ exportName: strings.varName('states') })
    for (const [stateName, state] of Object.entries(states)) {
      const module = new StateModule(stateName, state)
      this.pushDep(module)
    }
  }
}
