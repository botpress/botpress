import bluebird from 'bluebird'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class StateModule extends Module {
  public static async create(name: string, state: types.StateDefinition): Promise<StateModule> {
    const schema = state.schema
    const exportName = strings.typeName(name)
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName,
      content: await jsonSchemaToTypeScriptType(schema, exportName),
    }
    return new StateModule(def)
  }
}

export class StatesModule extends ReExportTypeModule {
  public static async create(states: Record<string, types.StateDefinition>): Promise<StatesModule> {
    const stateModules = await bluebird.map(Object.entries(states), async ([stateName, state]) =>
      StateModule.create(stateName, state)
    )

    const inst = new StatesModule({
      exportName: strings.typeName('states'),
    })
    inst.pushDep(...stateModules)
    return inst
  }
}
