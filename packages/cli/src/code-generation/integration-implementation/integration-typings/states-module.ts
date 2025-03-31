import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import * as gen from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

export class StatePayloadModule extends Module {
  public constructor(private _state: sdk.StateDefinition) {
    super({
      path: 'payload.ts',
      exportName: strings.typeName('Payload'),
    })
  }

  public async getContent() {
    return gen.zuiSchemaToTypeScriptType(this._state.schema, 'Payload')
  }
}

export class StateModule extends Module {
  private _payloadModule: StatePayloadModule

  public constructor(
    private _name: string,
    private _state: sdk.StateDefinition
  ) {
    super({
      path: consts.INDEX_FILE,
      exportName: strings.typeName(_name),
    })

    this._payloadModule = new StatePayloadModule(_state)
    this.pushDep(this._payloadModule)
  }

  public async getContent(): Promise<string> {
    const { _payloadModule } = this
    const payloadImport = _payloadModule.import(this)

    const exportName = strings.typeName(this._name)

    return [
      consts.GENERATED_HEADER,
      `import * as ${_payloadModule.name} from './${payloadImport}'`,
      `export type ${exportName} = {`,
      `  type: ${gen.primitiveToTypescriptValue(this._state.type)},`,
      `  payload: ${_payloadModule.name}.${_payloadModule.exportName}`,
      '}',
    ].join('\n')
  }
}

export class StatesModule extends ReExportTypeModule {
  public constructor(states: Record<string, sdk.StateDefinition>) {
    super({ exportName: strings.typeName('states') })
    for (const [stateName, state] of Object.entries(states)) {
      const module = new StateModule(stateName, state)
      module.unshift(stateName)
      this.pushDep(module)
    }
  }
}
