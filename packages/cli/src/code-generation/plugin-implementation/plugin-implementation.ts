import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { Module } from '../module'
import { PluginsTypingsModule } from './plugin-typings'

export class PluginImplementationModule extends Module {
  private _typingsModule: PluginsTypingsModule

  public constructor(plugin: sdk.PluginDefinition) {
    super({
      exportName: 'Plugin',
      path: consts.INDEX_FILE,
    })

    this._typingsModule = new PluginsTypingsModule(plugin)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)
  }

  public async getContent() {
    const typingsImport = this._typingsModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `export * from "./${typingsImport}"`,
      '',
      `type TPlugin = ${this._typingsModule.name}.${this._typingsModule.exportName}`,
      '',
      'export class Plugin extends sdk.Plugin<TPlugin> {}',
      '',
    ].join('\n')
  }
}
