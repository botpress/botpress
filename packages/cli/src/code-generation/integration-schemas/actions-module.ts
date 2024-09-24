import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

type ActionInput = types.integration.ActionDefinition['input']
type ActionOutput = types.integration.ActionDefinition['output']

export class ActionInputModule extends Module {
  public constructor(private _input: ActionInput) {
    const name = 'input'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._input)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class ActionOutputModule extends Module {
  public constructor(private _output: ActionOutput) {
    const name = 'output'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._output)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class ActionModule extends ReExportTypeModule {
  public constructor(actionName: string, action: types.integration.ActionDefinition) {
    super({ exportName: strings.typeName(actionName) })

    const inputModule = new ActionInputModule(action.input)
    const outputModule = new ActionOutputModule(action.output)

    this.pushDep(inputModule)
    this.pushDep(outputModule)
  }
}

export class ActionsModule extends ReExportTypeModule {
  public constructor(actions: Record<string, types.integration.ActionDefinition>) {
    super({ exportName: strings.typeName('actions') })
    for (const [actionName, action] of Object.entries(actions)) {
      const module = new ActionModule(actionName, action)
      module.unshift(actionName)
      this.pushDep(module)
    }
  }
}
