import { compile } from 'json-schema-to-typescript'
import { casing } from '../utils'
import { Module, ModuleDef, ReExportTypeModule } from './module'
import type * as types from './typings'

type ActionInput = types.Action['input']
type ActionOutput = types.Action['output']

export class ActionInputModule extends Module {
  public static async create(input: ActionInput): Promise<ActionInputModule> {
    const schema = input.schema ?? {}
    const filename = 'input.ts'
    const def: ModuleDef = {
      path: filename,
      exportName: 'Input',
      content: await compile(schema, filename),
    }
    return new ActionInputModule(def)
  }
}

export class ActionOutputModule extends Module {
  public static async create(output: ActionOutput): Promise<ActionOutputModule> {
    const schema = output.schema ?? {}
    const filename = 'output.ts'
    const def: ModuleDef = {
      path: filename,
      exportName: 'Output',
      content: await compile(schema, filename),
    }
    return new ActionOutputModule(def)
  }
}

export class ActionModule extends ReExportTypeModule {
  public static async create(actionName: string, action: types.Action): Promise<ActionModule> {
    const inputModule = await ActionInputModule.create(action.input ?? {})
    const outputModule = await ActionOutputModule.create(action.output ?? {})

    const inst = new ActionModule({
      exportName: `Action${casing.to.pascalCase(actionName)}`,
    })

    inst.pushDep(inputModule)
    inst.pushDep(outputModule)

    return inst
  }
}
