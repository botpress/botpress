import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class EventModule extends Module {
  public constructor(
    name: string,
    private _event: types.EventDefinition
  ) {
    const eventName = name
    const exportName = strings.varName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    if (!this._event.schema) {
      return `export const ${this.exportName} = z.object({});`
    }
    return jsonSchemaToTypescriptZuiSchema(
      this._event.schema,
      this.exportName,
      gen.primitiveRecordToTypescriptValues({
        title: this._event.title,
        description: this._event.description,
      })
    )
  }
}

export class EventsModule extends ReExportVariableModule {
  public constructor(events: Record<string, types.EventDefinition>) {
    super({ exportName: strings.varName('events') })
    for (const [eventName, event] of Object.entries(events)) {
      const module = new EventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
