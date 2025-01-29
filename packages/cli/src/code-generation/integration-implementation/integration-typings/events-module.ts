import * as sdk from '@botpress/sdk'
import { zuiSchemaToTypeScriptType } from '../../generators'
import { Module, ReExportTypeModule } from '../../module'
import * as strings from '../../strings'

export class EventModule extends Module {
  public constructor(
    name: string,
    private _event: sdk.EventDefinition
  ) {
    const eventName = name
    const exportName = strings.typeName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    return zuiSchemaToTypeScriptType(this._event.schema, this.exportName)
  }
}

export class EventsModule extends ReExportTypeModule {
  public constructor(events: Record<string, sdk.EventDefinition>) {
    super({ exportName: strings.typeName('events') })
    for (const [eventName, event] of Object.entries(events)) {
      const module = new EventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
