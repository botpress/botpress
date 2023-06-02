import { compile } from 'json-schema-to-typescript'
import { casing } from '../utils'
import { Module, ModuleDef } from './module'
import type { Message } from './typings'

export class MessageModule extends Module {
  public static async create(name: string, message: Message): Promise<MessageModule> {
    const schema = message.schema ?? {}
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName: casing.to.pascalCase(name),
      content: await compile(schema, name),
    }
    return new MessageModule(def)
  }
}
