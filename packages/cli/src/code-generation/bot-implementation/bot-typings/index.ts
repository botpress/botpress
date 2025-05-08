import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { IntegrationTypingsModule } from '../../integration-implementation/integration-typings'
import { Module, ReExportTypeModule } from '../../module'
import { ActionsModule } from './actions-module'
import { ConfigurationModule } from './configuration-module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'
import { TablesModule } from './tables-module'
import { WorkflowsModule } from './workflows-module'

class BotIntegrationsModule extends ReExportTypeModule {
  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'Integrations',
    })

    for (const [alias, integration] of Object.entries(bot.integrations ?? {})) {
      const integrationModule = new IntegrationTypingsModule(integration.definition).setCustomTypeName(alias)
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
  workflowsModule: WorkflowsModule
  configurationModule: ConfigurationModule
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

    const workflowsModule = new WorkflowsModule(bot.workflows ?? {})
    workflowsModule.unshift('workflows')
    this.pushDep(workflowsModule)

    const configurationModule = new ConfigurationModule(bot.configuration)
    configurationModule.unshift('configuration')
    this.pushDep(configurationModule)

    this._dependencies = {
      integrationsModule,
      eventsModule,
      statesModule,
      actionsModule,
      tablesModule,
      workflowsModule,
      configurationModule,
    }
  }

  public async getContent() {
    const {
      integrationsModule,
      eventsModule,
      statesModule,
      actionsModule,
      tablesModule,
      workflowsModule,
      configurationModule,
    } = this._dependencies

    const integrationsImport = integrationsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const tablesImport = tablesModule.import(this)
    const actionsImport = actionsModule.import(this)
    const workflowsImport = workflowsModule.import(this)
    const configurationImport = configurationModule.import(this)

    return [
      consts.GENERATED_HEADER,
      `import * as ${integrationsModule.name} from './${integrationsImport}'`,
      `import * as ${eventsModule.name} from './${eventsImport}'`,
      `import * as ${statesModule.name} from './${statesImport}'`,
      `import * as ${actionsModule.name} from './${actionsImport}'`,
      `import * as ${tablesModule.name} from './${tablesImport}'`,
      `import * as ${workflowsModule.name} from './${workflowsImport}'`,
      `import * as ${configurationModule.name} from './${configurationImport}'`,
      '',
      `export * as ${integrationsModule.name} from './${integrationsImport}'`,
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      `export * as ${actionsModule.name} from './${actionsImport}'`,
      `export * as ${tablesModule.name} from './${tablesImport}'`,
      `export * as ${workflowsModule.name} from './${workflowsImport}'`,
      `export * as ${configurationModule.name} from './${configurationImport}'`,
      '',
      'export type TBot = {',
      `  configuration: ${configurationModule.name}.${configurationModule.exportName}`,
      `  integrations: ${integrationsModule.name}.${integrationsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      `  tables: ${tablesModule.name}.${tablesModule.exportName}`,
      `  workflows: ${workflowsModule.name}.${workflowsModule.exportName}`,
      '}',
    ].join('\n')
  }
}
