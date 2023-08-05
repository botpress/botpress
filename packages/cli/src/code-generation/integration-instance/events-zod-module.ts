import bluebird from 'bluebird'
import { casing } from '../../utils'
import { jsonSchemaToTypeScriptZod } from '../generators'
import { Module, ModuleDef } from '../module'
import { ReExportSchemaModule } from './schema-module'
import type * as types from './types'

export class EventModule extends Module {
  public static async create(name: string, event: types.EventDefinition): Promise<EventModule> {
    const schema = event.schema ?? {}
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.camelCase(name),
      content: await jsonSchemaToTypeScriptZod(schema, name),
    }
    return new EventModule(def)
  }
}

export class EventsModule extends ReExportSchemaModule {
  public static async create(events: Record<string, types.EventDefinition>): Promise<EventsModule> {
    const eventModules = await bluebird.map(Object.entries(events), async ([eventName, event]) =>
      EventModule.create(eventName, event)
    )

    const inst = new EventsModule({
      exportName: 'events',
    })
    inst.pushDep(...eventModules)
    return inst
  }
}
