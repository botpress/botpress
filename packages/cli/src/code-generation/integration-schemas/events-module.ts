import bluebird from 'bluebird'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class EventModule extends Module {
  public static async create(name: string, event: types.EventDefinition): Promise<EventModule> {
    const eventName = name
    const schema = event.schema
    const exportName = strings.typeName(eventName)
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName,
      content: await jsonSchemaToTypeScriptType(schema, exportName),
    }
    return new EventModule(def)
  }
}

export class EventsModule extends ReExportTypeModule {
  public static async create(events: Record<string, types.EventDefinition>): Promise<EventsModule> {
    const eventModules = await bluebird.map(Object.entries(events), async ([eventName, event]) =>
      EventModule.create(eventName, event)
    )

    const inst = new EventsModule({
      exportName: strings.typeName('events'),
    })
    inst.pushDep(...eventModules)
    return inst
  }
}
