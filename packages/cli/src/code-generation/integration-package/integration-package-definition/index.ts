import * as consts from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import { ActionsModule } from './actions-module'
import { ChannelsModule } from './channels-module'
import { DefaultConfigurationModule } from './configuration-module'
import { ConfigurationsModule } from './configurations-module'
import { EntitiesModule } from './entities-module'
import { EventsModule } from './events-module'
import { InterfacesModule } from './interfaces-module'
import { StatesModule } from './states-module'
import * as types from './typings'

type IntegrationPackageModuleDependencies = {
  defaultConfigModule: DefaultConfigurationModule
  configurationsModule: ConfigurationsModule
  actionsModule: ActionsModule
  channelsModule: ChannelsModule
  eventsModule: EventsModule
  statesModule: StatesModule
  entitiesModule: EntitiesModule
  interfacesModule: InterfacesModule
}

export class IntegrationPackageDefinitionModule extends Module {
  private _dependencies: IntegrationPackageModuleDependencies

  public constructor(private _integration: types.IntegrationDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

    const defaultConfigModule = new DefaultConfigurationModule(_integration.configuration ?? {})
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

    const interfacesModule = new InterfacesModule(_integration.interfaces ?? {})
    interfacesModule.unshift('interfaces')

    this._dependencies = {
      defaultConfigModule,
      configurationsModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
      entitiesModule,
      interfacesModule,
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
      interfacesModule,
    } = this._dependencies

    const defaultConfigImport = defaultConfigModule.import(this)
    const configurationsImport = configurationsModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const entitiesImport = entitiesModule.import(this)
    const interfacesImport = interfacesModule.import(this)

    const user = {
      tags: this._integration.user?.tags ?? {},
      creation: this._integration.user?.creation ?? { enabled: false, requiredTags: [] },
    }

    content += [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `import * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `import * as ${actionsModule.name} from "./${actionsImport}"`,
      `import * as ${channelsModule.name} from "./${channelsImport}"`,
      `import * as ${eventsModule.name} from "./${eventsImport}"`,
      `import * as ${statesModule.name} from "./${statesImport}"`,
      `import * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `import * as ${interfacesModule.name} from "./${interfacesImport}"`,
      `export * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `export * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${interfacesModule.name} from "./${interfacesImport}"`,
      '',
      'export default {',
      `  name: "${this._integration.name}",`,
      `  version: "${this._integration.version}",`,
      `  user: ${stringifySingleLine(user)},`,
      `  configuration: ${defaultConfigModule.name}.${defaultConfigModule.exportName},`,
      `  configurations: ${configurationsModule.name}.${configurationsModule.exportName},`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName},`,
      `  channels: ${channelsModule.name}.${channelsModule.exportName},`,
      `  events: ${eventsModule.name}.${eventsModule.exportName},`,
      `  states: ${statesModule.name}.${statesModule.exportName},`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exportName},`,
      `  interfaces: ${interfacesModule.name}.${interfacesModule.exportName},`,
      '} satisfies sdk.IntegrationPackage["definition"]',
    ].join('\n')

    return content
  }
}
