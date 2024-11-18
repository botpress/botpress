import * as sdk from '@botpress/sdk'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

type ActionInput = sdk.BotActionDefinition['input']
type ActionOutput = sdk.BotActionDefinition['output']

export class ActionInputModule extends Module {
  public constructor(private _input: ActionInput) {
    const name = 'input'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._input.schema, this.exportName)
  }
}

export class ActionOutputModule extends Module {
  public constructor(private _output: ActionOutput) {
    const name = 'output'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._output.schema, this.exportName)
  }
}

export class ActionModule extends ReExportTypeModule {
  public constructor(actionName: string, action: sdk.BotActionDefinition) {
    super({ exportName: strings.typeName(actionName) })

    const inputModule = new ActionInputModule(action.input)
    const outputModule = new ActionOutputModule(action.output)

    this.pushDep(inputModule)
    this.pushDep(outputModule)
  }
}

export class ActionsModule extends ReExportTypeModule {
  public constructor(actions: Record<string, sdk.BotActionDefinition>) {
    super({ exportName: strings.typeName('actions') })
    for (const [actionName, action] of Object.entries(actions)) {
      const module = new ActionModule(actionName, action)
      module.unshift(actionName)
      this.pushDep(module)
    }
  }
}
