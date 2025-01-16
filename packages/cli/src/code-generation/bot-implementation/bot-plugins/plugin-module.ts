import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { Module, ModuleProps } from '../../module'
import { PluginTypingsModule } from '../../plugin-implementation/plugin-typings'

type PluginInstance = NonNullable<sdk.BotDefinition['plugins']>[string]

class BundleJsModule extends Module {
  private _indexJs: string
  public constructor(plugin: PluginInstance) {
    super({
      path: 'bundle.js',
      exportName: 'default',
    })
    this._indexJs = plugin.implementation.toString()
  }

  public async getContent() {
    return this._indexJs
  }
}

class BundleDtsModule extends Module {
  public constructor(private _typingsModule: PluginTypingsModule) {
    super({
      path: 'bundle.d.ts',
      exportName: 'default',
    })
  }

  public async getContent() {
    const typingsImport = this._typingsModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `type TPlugin = sdk.DefaultPlugin<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      'export default new sdk.Plugin<TPlugin>({})',
      '',
    ].join('\n')
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
  private _bundleJsModule: BundleJsModule
  private _bundleDtsModule: BundleDtsModule
  private _configModule: PluginConfigModule

  public readonly pluginName: string

  public constructor(plugin: PluginInstance) {
    super({
      exportName: 'default',
      path: consts.INDEX_FILE,
    })

    this.pluginName = plugin.name

    this._typingsModule = new PluginTypingsModule(plugin.definition)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)

    this._bundleJsModule = new BundleJsModule(plugin)
    this.pushDep(this._bundleJsModule)

    this._bundleDtsModule = new BundleDtsModule(this._typingsModule)
    this.pushDep(this._bundleDtsModule)

    this._configModule = new PluginConfigModule({
      path: 'config.ts',
      exportName: 'default',
      plugin,
    })
    this.pushDep(this._configModule)
  }

  public async getContent() {
    const configImport = this._configModule.import(this)
    const typingsImport = this._typingsModule.import(this)
    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      'import bundle from "./bundle"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `import * as ${this._configModule.name} from "./${configImport}"`,
      '',
      `export type TPlugin = sdk.DefaultPlugin<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      `export const configuration = ${this._configModule.name}.${this._configModule.exportName}.configuration`,
      `export const interfaces = ${this._configModule.name}.${this._configModule.exportName}.interfaces`,
      '',
      `export default bundle.initialize(${this._configModule.name}.${this._configModule.exportName})`,
      '',
    ].join('\n')
  }
}
