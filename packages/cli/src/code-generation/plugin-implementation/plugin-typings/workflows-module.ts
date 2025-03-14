import * as sdk from '@botpress/sdk'
import { primitiveToTypescriptValue, zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

type WorkflowInput = sdk.BotWorkflowDefinition['input']
type WorkflowOutput = sdk.BotWorkflowDefinition['output']
type WorkflowTags = sdk.BotWorkflowDefinition['tags']

export class WorkflowInputModule extends Module {
  public constructor(private _input: WorkflowInput) {
    const name = 'input'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._input.schema, this.exportName)
  }
}

export class WorkflowOutputModule extends Module {
  public constructor(private _output: WorkflowOutput) {
    const name = 'output'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._output.schema, this.exportName)
  }
}

export class WorkflowTagsModule extends Module {
  public constructor(private _tags: WorkflowTags) {
    const name = 'tags'
    const exportName = strings.typeName(name)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const tags = Object.keys(this._tags ?? {})
      .map((tagName) => `${primitiveToTypescriptValue(tagName)}: string`)
      .join(', ')

    return `export type ${this.exportName} = { ${tags} }`
  }
}

export class WorkflowModule extends ReExportTypeModule {
  public constructor(workflowName: string, workflow: sdk.BotWorkflowDefinition) {
    super({ exportName: strings.typeName(workflowName) })

    const inputModule = new WorkflowInputModule(workflow.input)
    const outputModule = new WorkflowOutputModule(workflow.output)
    const tagsModule = new WorkflowTagsModule(workflow.tags)

    this.pushDep(inputModule)
    this.pushDep(outputModule)
    this.pushDep(tagsModule)
  }
}

export class WorkflowsModule extends ReExportTypeModule {
  public constructor(workflows: Record<string, sdk.BotWorkflowDefinition>) {
    super({ exportName: strings.typeName('workflows') })
    for (const [workflowName, workflow] of Object.entries(workflows)) {
      const module = new WorkflowModule(workflowName, workflow)
      module.unshift(workflowName)
      this.pushDep(module)
    }
  }
}
