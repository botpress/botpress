import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

type ActionInput = types.ActionDefinition['input']
type ActionOutput = types.ActionDefinition['output']

export class ActionInputModule extends Module {
  public constructor(private _input: ActionInput) {
    const name = 'input'
    const exportName = strings.varName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._input.schema, this.exportName)
  }
}

export class ActionOutputModule extends Module {
  public constructor(private _output: ActionOutput) {
    const name = 'output'
    const exportName = strings.varName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._output.schema, this.exportName)
  }
}

export class ActionModule extends ReExportVariableModule {
  public constructor(actionName: string, action: types.ActionDefinition) {
    super({
      exportName: strings.varName(actionName),
      extraProps: gen.primitiveRecordToTypescriptValues({
        title: action.title,
        description: action.description,
        billable: action.billable,
        cacheable: action.cacheable,
      }),
    })

    const inputModule = new ActionInputModule(action.input)
    const outputModule = new ActionOutputModule(action.output)

    this.pushDep(inputModule)
    this.pushDep(outputModule)
  }
}

export class ActionsModule extends ReExportVariableModule {
  public constructor(actions: Record<string, types.ActionDefinition>) {
    super({ exportName: strings.varName('actions') })
    for (const [actionName, action] of Object.entries(actions)) {
      const module = new ActionModule(actionName, action)
      module.unshift(actionName)
      this.pushDep(module)
    }
  }
}
