import * as sdk from '@botpress/sdk'
import * as consts from '../const'
import { IntegrationTypingsModule } from '../integration-schemas'
import * as mapIntegration from '../map-integration'
import { Module, ReExportTypeModule } from '../module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'

class BotIntegrationsModule extends ReExportTypeModule {
  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'TIntegrations',
    })

    for (const [alias, integration] of Object.entries(bot.integrations ?? {})) {
      const definition = mapIntegration.from.sdk(integration.definition)
      const integrationModule = new IntegrationTypingsModule(definition)
      integrationModule.unshift(alias)
      this.pushDep(integrationModule)
    }
  }
}

type BotTypingsIndexDependencies = {
  integrationsModule: BotIntegrationsModule
  eventsModule: EventsModule
  statesModule: StatesModule
}

export type BotTypingsModuleProps = {
  fileName: string
}
export class BotTypingsModule extends Module {
  private _dependencies: BotTypingsIndexDependencies

  public constructor(bot: sdk.BotDefinition, props: Partial<BotTypingsModuleProps> = {}) {
    super({
      exportName: 'TBot',
      path: props.fileName ?? consts.INDEX_FILE,
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

    this._dependencies = {
      integrationsModule,
      eventsModule,
      statesModule,
    }
  }

  public async getContent() {
    const { integrationsModule, eventsModule, statesModule } = this._dependencies

    const integrationsImport = integrationsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    return [
      consts.GENERATED_HEADER,
      `import * as ${integrationsModule.name} from './${integrationsImport}'`,
      `import * as ${eventsModule.name} from './${eventsModule.name}'`,
      `import * as ${statesModule.name} from './${statesModule.name}'`,
      '',
      `export * as ${integrationsModule.name} from './${integrationsImport}'`,
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      '',
      'export type TBot = {',
      `  integrations: ${integrationsModule.name}.${integrationsModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      '}',
    ].join('\n')
  }
}
