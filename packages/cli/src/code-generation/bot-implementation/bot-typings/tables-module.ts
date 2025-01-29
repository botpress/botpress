import * as sdk from '@botpress/sdk'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

export class TableModule extends Module {
  public constructor(
    name: string,
    private _table: sdk.BotTableDefinition
  ) {
    super({
      path: `${name}.ts`,
      exportName: strings.typeName(name),
    })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._table.schema, this.exportName)
  }
}

export class TablesModule extends ReExportTypeModule {
  public constructor(tables: Record<string, sdk.BotTableDefinition>) {
    super({ exportName: strings.typeName('tables') })
    for (const [tableName, table] of Object.entries(tables)) {
      const module = new TableModule(tableName, table)
      this.pushDep(module)
    }
  }
}
