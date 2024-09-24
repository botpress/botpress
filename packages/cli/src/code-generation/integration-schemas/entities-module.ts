import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'
import type * as types from '../typings'

export class EntityModule extends Module {
  public constructor(name: string, private _entity: types.integration.EntityDefinition) {
    const entityName = name
    const exportName = strings.typeName(entityName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._entity)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class EntitiesModule extends ReExportTypeModule {
  public constructor(entities: Record<string, types.integration.EntityDefinition>) {
    super({ exportName: strings.typeName('entities') })

    for (const [entityName, entity] of Object.entries(entities)) {
      const module = new EntityModule(entityName, entity)
      this.pushDep(module)
    }
  }
}
