import * as sdk from '@botpress/sdk'
import _ from 'lodash'
import { GENERATED_HEADER, INDEX_FILE } from '../../consts'
import { Module } from '../../module'
import { ActionsModule } from './actions-module'
import { ChannelsModule } from './channels-module'
import { EntitiesModule } from './entities-module'
import { EventsModule } from './events-module'

type InterfaceTypingsModuleDependencies = {
  actionsModule: ActionsModule
  channelsModule: ChannelsModule
  eventsModule: EventsModule
  entitiesModule: EntitiesModule
}

export class InterfaceTypingsModule extends Module {
  private _dependencies: InterfaceTypingsModuleDependencies

  public constructor(private _interface: sdk.InterfacePackage['definition']) {
    super({
      path: INDEX_FILE,
      exportName: 'TInterface',
    })

    const references: Record<string, sdk.z.Schema> = _.mapValues(_interface.entities, (e) => e.schema)

    type ZodObjectSchema = sdk.z.ZodObject | sdk.z.ZodRecord
    const derefObject = (obj: { schema: ZodObjectSchema }) => {
      return {
        ...obj,
        schema: obj.schema.dereference(references) as ZodObjectSchema,
      }
    }

    _interface = {
      ..._interface,
      actions: _.mapValues(_interface.actions, (a) => ({
        ...a,
        input: derefObject(a.input),
        output: derefObject(a.output),
      })),
      channels: _.mapValues(_interface.channels, (c) => ({
        ...c,
        messages: _.mapValues(c.messages, (m) => derefObject(m)),
      })),
      events: _.mapValues(_interface.events, (e) => derefObject(e)),
    }

    const actionsModule = new ActionsModule(_interface.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = new ChannelsModule(_interface.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = new EventsModule(_interface.events ?? {})
    eventsModule.unshift('events')

    const entitiesModule = new EntitiesModule(_interface.entities ?? {})
    entitiesModule.unshift('entities')

    this._dependencies = {
      actionsModule,
      channelsModule,
      eventsModule,
      entitiesModule,
    }

    for (const dep of Object.values(this._dependencies)) {
      this.pushDep(dep)
    }
  }

  public async getContent() {
    let content = ''

    const { actionsModule, channelsModule, eventsModule, entitiesModule } = this._dependencies

    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const entitiesImport = entitiesModule.import(this)

    content += [
      GENERATED_HEADER,
      `import * as ${actionsModule.name} from "./${actionsImport}"`,
      `import * as ${channelsModule.name} from "./${channelsImport}"`,
      `import * as ${eventsModule.name} from "./${eventsImport}"`,
      `import * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      '',
      'export type TInterface = {',
      `  name: "${this._interface.name}"`,
      `  version: "${this._interface.version}"`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      `  channels: ${channelsModule.name}.${channelsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exportName}`,
      '}',
    ].join('\n')

    return content
  }
}
