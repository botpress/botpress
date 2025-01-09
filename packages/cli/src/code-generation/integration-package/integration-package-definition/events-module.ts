import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class EventModule extends Module {
  public constructor(
    name: string,
    private _event: types.ApiEventDefinition
  ) {
    const eventName = name
    const exportName = strings.varName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    if (!this._event.schema) {
      return `export const ${this.exportName} = z.object({});`
    }
    return jsonSchemaToTypescriptZuiSchema(this._event.schema, this.exportName)
  }
}

export class EventsModule extends ReExportVariableModule {
  public constructor(events: Record<string, types.ApiEventDefinition>) {
    super({ exportName: strings.varName('events') })
    for (const [eventName, event] of Object.entries(events)) {
      const module = new EventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
