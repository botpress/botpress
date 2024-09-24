import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class EventModule extends Module {
  public constructor(name: string, private _event: types.integration.EventDefinition) {
    const eventName = name
    const exportName = strings.typeName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._event)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class EventsModule extends ReExportTypeModule {
  public constructor(events: Record<string, types.integration.EventDefinition>) {
    super({ exportName: strings.typeName('events') })
    for (const [eventName, event] of Object.entries(events)) {
      const module = new EventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
