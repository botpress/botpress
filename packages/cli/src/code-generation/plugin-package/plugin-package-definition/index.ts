import * as consts from '../../consts'
import { stringifySingleLine } from '../../generators'
import { Module } from '../../module'
import { ActionsModule } from './actions-module'
import { DefaultConfigurationModule } from './configuration-module'
import { EventsModule } from './events-module'
import { InterfacesModule } from './interfaces-module'
import { StatesModule } from './states-module'
import * as types from './typings'

type PluginPackageModuleDependencies = {
  defaultConfigModule: DefaultConfigurationModule
  actionsModule: ActionsModule
  eventsModule: EventsModule
  statesModule: StatesModule
  interfacesModule: InterfacesModule
}

export class PluginPackageDefinitionModule extends Module {
  private _dependencies: PluginPackageModuleDependencies

  public constructor(private _plugin: types.PluginDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

    const defaultConfigModule = new DefaultConfigurationModule(_plugin.configuration ?? {})
    defaultConfigModule.unshift('configuration')

    const actionsModule = new ActionsModule(_plugin.actions ?? {})
    actionsModule.unshift('actions')

    const eventsModule = new EventsModule(_plugin.events ?? {})
    eventsModule.unshift('events')

    const statesModule = new StatesModule(_plugin.states ?? {})
    statesModule.unshift('states')

    const interfacesModule = new InterfacesModule(_plugin.dependencies?.interfaces ?? {})
    interfacesModule.unshift('interfaces')

    this._dependencies = {
      defaultConfigModule,
      actionsModule,
      eventsModule,
      statesModule,
      interfacesModule,
    }

    for (const dep of Object.values(this._dependencies)) {
      this.pushDep(dep)
    }
  }

  public async getContent() {
    let content = ''

    const { defaultConfigModule, actionsModule, eventsModule, statesModule, interfacesModule } = this._dependencies

    const defaultConfigImport = defaultConfigModule.import(this)
    const actionsImport = actionsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const interfacesImport = interfacesModule.import(this)

    const user = {
      tags: this._plugin.user?.tags ?? {},
    }

    const conversation = {
      tags: this._plugin.conversation?.tags ?? {},
    }

    content += [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `import * as ${actionsModule.name} from "./${actionsImport}"`,
      `import * as ${eventsModule.name} from "./${eventsImport}"`,
      `import * as ${statesModule.name} from "./${statesImport}"`,
      `import * as ${interfacesModule.name} from "./${interfacesImport}"`,
      `export * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${interfacesModule.name} from "./${interfacesImport}"`,
      '',
      'export default {',
      `  name: "${this._plugin.name}",`,
      `  version: "${this._plugin.version}",`,
      `  user: ${stringifySingleLine(user)},`,
      `  conversation: ${stringifySingleLine(conversation)},`,
      `  configuration: ${defaultConfigModule.name}.${defaultConfigModule.exportName},`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName},`,
      `  events: ${eventsModule.name}.${eventsModule.exportName},`,
      `  states: ${statesModule.name}.${statesModule.exportName},`,
      `  interfaces: ${interfacesModule.name}.${interfacesModule.exportName},`,
      '} satisfies sdk.PluginPackage["definition"]',
    ].join('\n')

    return content
  }
}
