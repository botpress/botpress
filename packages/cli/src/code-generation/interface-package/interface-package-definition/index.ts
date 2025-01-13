import * as consts from '../../consts'
import { Module } from '../../module'
import { ActionsModule } from './actions-module'
import { ChannelsModule } from './channels-module'
import { EntitiesModule } from './entities-module'
import { EventsModule } from './events-module'
import * as types from './typings'

type InterfacePackageModuleDependencies = {
  actionsModule: ActionsModule
  channelsModule: ChannelsModule
  eventsModule: EventsModule
  entitiesModule: EntitiesModule
}

export class InterfacePackageDefinitionModule extends Module {
  private _dependencies: InterfacePackageModuleDependencies

  public constructor(private _interface: types.InterfaceDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

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
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import * as ${actionsModule.name} from "./${actionsImport}"`,
      `import * as ${channelsModule.name} from "./${channelsImport}"`,
      `import * as ${eventsModule.name} from "./${eventsImport}"`,
      `import * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      '',
      'export default {',
      `  name: "${this._interface.name}",`,
      `  version: "${this._interface.version}",`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName},`,
      `  channels: ${channelsModule.name}.${channelsModule.exportName},`,
      `  events: ${eventsModule.name}.${eventsModule.exportName},`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exportName},`,
      '} satisfies sdk.InterfacePackage["definition"]',
    ].join('\n')

    return content
  }
}
