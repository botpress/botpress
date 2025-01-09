import * as sdk from '@botpress/sdk'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

export class EntityModule extends Module {
  public constructor(
    name: string,
    private _entity: sdk.EntityDefinition
  ) {
    const entityName = name
    const exportName = strings.typeName(entityName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._entity.schema, this.exportName)
  }
}

export class EntitiesModule extends ReExportTypeModule {
  public constructor(entities: Record<string, sdk.EntityDefinition>) {
    super({ exportName: strings.typeName('entities') })

    for (const [entityName, entity] of Object.entries(entities)) {
      const module = new EntityModule(entityName, entity)
      this.pushDep(module)
    }
  }
}
