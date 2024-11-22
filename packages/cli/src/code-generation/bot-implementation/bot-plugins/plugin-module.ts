import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import { Module, SingleFileModule } from '../../module'
import { PluginTypingsModule } from '../../plugin-implementation/plugin-typings'

export class BotPluginModule extends Module {
  private _typingsModule: PluginTypingsModule
  private _implementationModule: SingleFileModule

  public readonly pluginName: string

  public constructor(plugin: sdk.PluginPackage) {
    super({
      exportName: 'default',
      path: consts.INDEX_DECLARATION_FILE,
    })

    this.pluginName = plugin.definition.name

    this._typingsModule = new PluginTypingsModule(plugin.definition)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)

    this._implementationModule = new SingleFileModule({
      path: 'index.js',
      exportName: 'default',
      content: plugin.implementation.toString('base64'),
    })
    this.pushDep(this._implementationModule)
  }

  public async getContent() {
    const typingsImport = this._typingsModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `export * from "./${typingsImport}"`,
      '',
      `type TPlugin = sdk.DefaultPlugin<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      'export default new sdk.Plugin<TPlugin>()',
      '',
    ].join('\n')
  }
}
