import * as sdk from '@botpress/sdk'
import { GENERATED_HEADER, INDEX_FILE } from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import { ActionsModule } from './actions-module'
import { ChannelsModule } from './channels-module'
import { DefaultConfigurationModule } from './configuration-module'
import { ConfigurationsModule } from './configurations-module'
import { EntitiesModule } from './entities-module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'

type IntegrationTypingsModuleDependencies = {
  defaultConfigModule: DefaultConfigurationModule
  configurationsModule: ConfigurationsModule
  actionsModule: ActionsModule
  channelsModule: ChannelsModule
  eventsModule: EventsModule
  statesModule: StatesModule
  entitiesModule: EntitiesModule
}

export class IntegrationTypingsModule extends Module {
  private _dependencies: IntegrationTypingsModuleDependencies

  public constructor(private _integration: sdk.IntegrationPackage['definition']) {
    super({
      path: INDEX_FILE,
      exportName: 'TIntegration',
    })

    const defaultConfigModule = new DefaultConfigurationModule(_integration.configuration)
    defaultConfigModule.unshift('configuration')

    const configurationsModule = new ConfigurationsModule(_integration.configurations ?? {})
    configurationsModule.unshift('configurations')

    const actionsModule = new ActionsModule(_integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = new ChannelsModule(_integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = new EventsModule(_integration.events ?? {})
    eventsModule.unshift('events')

    const statesModule = new StatesModule(_integration.states ?? {})
    statesModule.unshift('states')

    const entitiesModule = new EntitiesModule(_integration.entities ?? {})
    entitiesModule.unshift('entities')

    this._dependencies = {
      defaultConfigModule,
      configurationsModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
      entitiesModule,
    }

    for (const dep of Object.values(this._dependencies)) {
      this.pushDep(dep)
    }
  }

  public async getContent() {
    let content = ''

    const {
      defaultConfigModule,
      configurationsModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
      entitiesModule,
    } = this._dependencies

    const defaultConfigImport = defaultConfigModule.import(this)
    const configurationsImport = configurationsModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const entitiesImport = entitiesModule.import(this)

    const user = {
      tags: this._integration.user?.tags ?? {},
      creation: this._integration.user?.creation ?? { enabled: false, requiredTags: [] },
    }

    content += [
      GENERATED_HEADER,
      `import * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `import * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `import * as ${actionsModule.name} from "./${actionsImport}"`,
      `import * as ${channelsModule.name} from "./${channelsImport}"`,
      `import * as ${eventsModule.name} from "./${eventsImport}"`,
      `import * as ${statesModule.name} from "./${statesImport}"`,
      `import * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `export * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      '',
      'export type TIntegration = {',
      `  name: "${this._integration.name}"`,
      `  version: "${this._integration.version}"`,
      `  user: ${stringifySingleLine(user)}`,
      `  configuration: ${defaultConfigModule.name}.${defaultConfigModule.exportName}`,
      `  configurations: ${configurationsModule.name}.${configurationsModule.exportName}`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      `  channels: ${channelsModule.name}.${channelsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exportName}`,
      '}',
    ].join('\n')

    return content
  }
}
