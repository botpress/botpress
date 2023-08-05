import bluebird from 'bluebird'
import { casing } from '../../utils'
import { zodToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import type * as types from './types'

export class StateModule extends Module {
  public static async create(name: string, state: types.StateDefinition): Promise<StateModule> {
    const schema = state.schema
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await zodToTypeScriptType(schema, name),
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
      exportName: 'States',
    })
    inst.pushDep(...stateModules)
    return inst
  }
}
