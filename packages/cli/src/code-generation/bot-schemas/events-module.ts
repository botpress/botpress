import { zuiSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import * as types from '../typings'

export class EventModule extends Module {
  public constructor(name: string, private _event: types.bot.EventDefinition) {
    const eventName = name
    const exportName = strings.typeName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._event.schema, this.exportName)
  }
}

export class EventsModule extends ReExportTypeModule {
  public constructor(events: Record<string, types.bot.EventDefinition>) {
    super({ exportName: strings.typeName('events') })
    for (const [eventName, event] of Object.entries(events)) {
      const module = new EventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
