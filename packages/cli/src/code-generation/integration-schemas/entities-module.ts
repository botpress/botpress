import bluebird from 'bluebird'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ModuleDef, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class EntityModule extends Module {
  public static async create(name: string, entity: types.EntityDefinition): Promise<EntityModule> {
    const entityName = name
    const schema = entity.schema
    const exportName = strings.typeName(entityName)
    const def: ModuleDef = {
      path: `${name}.ts`,
      exportName,
      content: await jsonSchemaToTypeScriptType(schema, exportName),
    }
    return new EntityModule(def)
  }
}

export class EntitiesModule extends ReExportTypeModule {
  public static async create(entities: Record<string, types.EntityDefinition>): Promise<EntitiesModule> {
    const entityModules = await bluebird.map(Object.entries(entities), async ([entityName, entity]) =>
      EntityModule.create(entityName, entity)
    )

    const inst = new EntitiesModule({
      exportName: strings.typeName('entities'),
    })
    inst.pushDep(...entityModules)
    return inst
  }
}
