import * as sdk from '@botpress/sdk'
import * as utils from '../../utils'
import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import * as strings from '../strings'

type BotEventDefinition = NonNullable<sdk.BotDefinition['events']>[string]

export class EventModule extends Module {
  public constructor(name: string, private _event: BotEventDefinition) {
    const eventName = name
    const exportName = strings.typeName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent() {
    const jsonSchema = utils.schema.mapZodToJsonSchema(this._event)
    return await jsonSchemaToTypeScriptType(jsonSchema, this.exportName)
  }
}

export class EventsModule extends ReExportTypeModule {
  public constructor(events: Record<string, BotEventDefinition>) {
    super({
      exportName: strings.typeName('events'),
    })
    const eventModules = Object.entries(events).map(([eventName, event]) => new EventModule(eventName, event))
    this.pushDep(...eventModules)
  }
}
