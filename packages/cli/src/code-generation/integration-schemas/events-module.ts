import bluebird from 'bluebird'
import { casing } from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import type * as types from '../typings'

export class EventModule extends Module {
  public static async create(name: string, event: types.EventDefinition): Promise<EventModule> {
    const schema = event.schema
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await jsonSchemaToTypeScriptType(schema, name),
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
      exportName: 'Events',
    })
    inst.pushDep(...eventModules)
    return inst
  }
}
