import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { IntegrationTypingsModule } from '../../integration-implementation/integration-typings'
import { Module, ReExportTypeModule } from '../../module'
import { ActionsModule } from './actions-module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'

class PluginIntegrationsModule extends ReExportTypeModule {
  public constructor(plugin: sdk.PluginDefinition | sdk.PluginPackage['definition']) {
    super({
      exportName: 'Integrations',
    })

    for (const [alias, integration] of Object.entries(plugin.integrations ?? {})) {
      const integrationModule = new IntegrationTypingsModule(integration.definition)
      integrationModule.unshift(alias)
      this.pushDep(integrationModule)
    }
  }
}

type PluginTypingsIndexDependencies = {
  integrationsModule: PluginIntegrationsModule
  eventsModule: EventsModule
  statesModule: StatesModule
  actionsModule: ActionsModule
}

export class PluginTypingsModule extends Module {
  private _dependencies: PluginTypingsIndexDependencies

  public constructor(plugin: sdk.PluginDefinition | sdk.PluginPackage['definition']) {
    super({
      exportName: 'TPlugin',
      path: consts.INDEX_FILE,
    })

    const integrationsModule = new PluginIntegrationsModule(plugin)
    integrationsModule.unshift('integrations')
    this.pushDep(integrationsModule)

    const eventsModule = new EventsModule(plugin.events ?? {})
    eventsModule.unshift('events')
    this.pushDep(eventsModule)

    const statesModule = new StatesModule(plugin.states ?? {})
    statesModule.unshift('states')
    this.pushDep(statesModule)

    const actionsModule = new ActionsModule(plugin.actions ?? {})
    actionsModule.unshift('actions')
    this.pushDep(actionsModule)

    this._dependencies = {
      integrationsModule,
      eventsModule,
      statesModule,
      actionsModule,
    }
  }

  public async getContent() {
    const { integrationsModule, eventsModule, statesModule, actionsModule } = this._dependencies

    const integrationsImport = integrationsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const actionsImport = actionsModule

    return [
      consts.GENERATED_HEADER,
      `import * as ${integrationsModule.name} from './${integrationsImport}'`,
      `import * as ${eventsModule.name} from './${eventsModule.name}'`,
      `import * as ${statesModule.name} from './${statesModule.name}'`,
      `import * as ${actionsModule.name} from './${actionsImport.name}'`,
      '',
      `export * as ${integrationsModule.name} from './${integrationsImport}'`,
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      `export * as ${actionsModule.name} from './${actionsImport.name}'`,
      '',
      'export type TPlugin = {',
      `  integrations: ${integrationsModule.name}.${integrationsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      '}',
    ].join('\n')
  }
}
