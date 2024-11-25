import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { Module, ModuleProps } from '../../module'
import { PluginTypingsModule } from '../../plugin-implementation/plugin-typings'

type PluginInstance = NonNullable<sdk.BotDefinition['plugins']>[string]

class ImplementationModule extends Module {
  private _content: string
  public constructor(props: ModuleProps & { content: string }) {
    super(props)
    this._content = props.content
  }

  public async getContent() {
    return this._content
  }
}

class PluginConfigModule extends Module {
  private _plugin: PluginInstance
  public constructor(config: ModuleProps & { plugin: PluginInstance }) {
    super(config)
    this._plugin = config.plugin
  }

  public async getContent() {
    const { interfaces, configuration } = this._plugin
    const content = JSON.stringify({ interfaces, configuration }, null, 2)
    return `export default ${content}`
  }
}

export class BotPluginModule extends Module {
  private _typingsModule: PluginTypingsModule
  private _implementationModule: ImplementationModule
  private _configModule: PluginConfigModule

  public readonly pluginName: string

  public constructor(plugin: PluginInstance) {
    super({
      exportName: 'default',
      path: consts.INDEX_DECLARATION_FILE,
    })

    this.pluginName = plugin.definition.name

    this._typingsModule = new PluginTypingsModule(plugin.definition)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)

    this._implementationModule = new ImplementationModule({
      path: 'index.js',
      exportName: 'default',
      content: plugin.implementation.toString('base64'),
    })
    this.pushDep(this._implementationModule)

    this._configModule = new PluginConfigModule({
      path: 'config.ts',
      exportName: 'default',
      plugin,
    })
    this.pushDep(this._configModule)
  }

  public async getContent() {
    const typingsImport = this._typingsModule.import(this)
    const configImport = this._configModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `import * as ${this._configModule.name} from "./${configImport}"`,
      '',
      `export * from "./${typingsImport}"`,
      '',
      `type TPlugin = sdk.DefaultPlugin<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      `export default new sdk.Plugin<TPlugin>().initialize(${this._configModule.name}.${this._configModule.exportName})`,
      '',
    ].join('\n')
  }
}
