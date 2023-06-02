import { compile } from 'json-schema-to-typescript'
import { casing } from '../utils'
import { Module, ModuleDef } from './module'
import type { Event } from './typings'

export class EventModule extends Module {
  public static async create(name: string, event: Event): Promise<EventModule> {
    const schema = event.schema ?? {}
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await compile(schema, name),
    }
    return new EventModule(def)
  }
}
