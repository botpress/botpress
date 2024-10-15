import { jsonSchemaToTypescriptZuiSchema } from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class EntityModule extends Module {
  public constructor(name: string, private _entity: types.ApiEntityDefinition) {
    const entityName = name
    const exportName = strings.varName(entityName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return jsonSchemaToTypescriptZuiSchema(this._entity.schema, this.exportName)
  }
}

export class EntitiesModule extends ReExportVariableModule {
  public constructor(entities: Record<string, types.ApiEntityDefinition>) {
    super({ exportName: strings.varName('entities') })

    for (const [entityName, entity] of Object.entries(entities)) {
      const module = new EntityModule(entityName, entity)
      this.pushDep(module)
    }
  }
}
