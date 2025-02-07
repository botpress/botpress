import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { IntegrationTypingsModule } from '../../integration-implementation/integration-typings'
import { Module, ReExportTypeModule } from '../../module'
import { ActionsModule } from './actions-module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'
import { TablesModule } from './tables-module'

class BotIntegrationsModule extends ReExportTypeModule {
  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'Integrations',
    })

    for (const [alias, integration] of Object.entries(bot.integrations ?? {})) {
      const integrationModule = new IntegrationTypingsModule(integration.definition)
      integrationModule.unshift(alias)
      this.pushDep(integrationModule)
    }
  }
}

type BotTypingsIndexDependencies = {
  integrationsModule: BotIntegrationsModule
  eventsModule: EventsModule
  statesModule: StatesModule
  actionsModule: ActionsModule
  tablesModule: TablesModule
}

export class BotTypingsModule extends Module {
  private _dependencies: BotTypingsIndexDependencies

  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'TBot',
      path: consts.INDEX_FILE,
    })

    const integrationsModule = new BotIntegrationsModule(bot)
    integrationsModule.unshift('integrations')
    this.pushDep(integrationsModule)

    const eventsModule = new EventsModule(bot.events ?? {})
    eventsModule.unshift('events')
    this.pushDep(eventsModule)

    const statesModule = new StatesModule(bot.states ?? {})
    statesModule.unshift('states')
    this.pushDep(statesModule)

    const tablesModule = new TablesModule(bot.tables ?? {})
    tablesModule.unshift('tables')
    this.pushDep(tablesModule)

    const actionsModule = new ActionsModule(bot.actions ?? {})
    actionsModule.unshift('actions')
    this.pushDep(actionsModule)

    this._dependencies = {
      integrationsModule,
      eventsModule,
      statesModule,
      actionsModule,
      tablesModule,
    }
  }

  public async getContent() {
    const { integrationsModule, eventsModule, statesModule, actionsModule, tablesModule } = this._dependencies

    const integrationsImport = integrationsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const actionsImport = actionsModule
    const tablesImport = tablesModule.import(this)

    return [
      consts.GENERATED_HEADER,
      `import * as ${integrationsModule.name} from './${integrationsImport}'`,
      `import * as ${eventsModule.name} from './${eventsModule.name}'`,
      `import * as ${statesModule.name} from './${statesModule.name}'`,
      `import * as ${actionsModule.name} from './${actionsImport.name}'`,
      `import * as ${tablesModule.name} from './${tablesImport}'`,
      '',
      `export * as ${integrationsModule.name} from './${integrationsImport}'`,
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      `export * as ${actionsModule.name} from './${actionsImport.name}'`,
      `export * as ${tablesModule.name} from './${tablesImport}'`,
      '',
      'export type TBot = {',
      `  integrations: ${integrationsModule.name}.${integrationsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      `  tables: ${tablesModule.name}.${tablesModule.exportName}`,
      '}',
    ].join('\n')
  }
}
