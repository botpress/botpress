import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { stringifySingleLine } from '../generators'
import { Module } from '../module'
import * as types from '../typings'
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

export type IntegrationTypingsModuleProps = {
  fileName: string
}

export class IntegrationTypingsModule extends Module {
  private _dependencies: IntegrationTypingsModuleDependencies

  public constructor(
    private _integration: types.IntegrationDefinition,
    props: Partial<IntegrationTypingsModuleProps> = {}
  ) {
    super({
      path: props.fileName ?? INDEX_FILE,
      exportName: 'TIntegration',
    })

    const defaultConfigModule = new DefaultConfigurationModule(_integration.configuration ?? { schema: {} })
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

    content += [
      GENERATED_HEADER,
      `import type * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `import type * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `import type * as ${actionsModule.name} from "./${actionsImport}"`,
      `import type * as ${channelsModule.name} from "./${channelsImport}"`,
      `import type * as ${eventsModule.name} from "./${eventsImport}"`,
      `import type * as ${statesModule.name} from "./${statesImport}"`,
      `import type * as ${entitiesModule.name} from "./${entitiesImport}"`,
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
      `  user: ${stringifySingleLine(this._integration.user)}`,
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
