import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { Module } from '../../module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'

type PluginTypingsIndexDependencies = {
  eventsModule: EventsModule
  statesModule: StatesModule
}

export class PluginsTypingsModule extends Module {
  private _dependencies: PluginTypingsIndexDependencies

  public constructor(plugin: sdk.PluginDefinition) {
    super({
      exportName: 'TPlugin',
      path: consts.INDEX_FILE,
    })

    const eventsModule = new EventsModule(plugin.events ?? {})
    eventsModule.unshift('events')
    this.pushDep(eventsModule)

    const statesModule = new StatesModule(plugin.states ?? {})
    statesModule.unshift('states')
    this.pushDep(statesModule)

    this._dependencies = {
      eventsModule,
      statesModule,
    }
  }

  public async getContent() {
    const { eventsModule, statesModule } = this._dependencies

    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    return [
      consts.GENERATED_HEADER,
      `import * as ${eventsModule.name} from './${eventsModule.name}'`,
      `import * as ${statesModule.name} from './${statesModule.name}'`,
      '',
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      '',
      'export type TPlugin = {',
      '  integrations: {}',
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      '}',
    ].join('\n')
  }
}
