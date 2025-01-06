import * as sdk from '@botpress/sdk'
import * as consts from '../../consts'
import * as mod from '../../module'
import * as strings from '../../strings'
import { BotPluginModule } from './plugin-module'

export class BotPluginsIndexModule extends mod.Module {
  private _pluginModules: BotPluginModule[]

  public constructor(sdkBotDefinition: sdk.BotDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: 'plugins',
    })

    const pluginsModules: BotPluginModule[] = []
    for (const plugin of Object.values(sdkBotDefinition.plugins ?? {})) {
      const pluginModule = new BotPluginModule(plugin)
      pluginModule.unshift(plugin.name)
      this.pushDep(pluginModule)
      pluginsModules.push(pluginModule)
    }

    this._pluginModules = pluginsModules
  }

  public async getContent(): Promise<string> {
    const modules = this._pluginModules.map((module) => ({
      importAlias: strings.importAlias(module.name),
      importFrom: module.import(this),
      module,
    }))

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      ...modules.map(({ importAlias, importFrom }) => `import * as ${importAlias} from "./${importFrom}";`),
      ...modules.map(({ importAlias, importFrom }) => `export * as ${importAlias} from "./${importFrom}";`),
      '',
      `export const ${this.exportName} = {`,
      ...modules.map(({ module, importAlias }) => `  "${module.pluginName}": ${importAlias}.${module.exportName},`),
      '}',
      '',
      'export type TPlugins = {',
      ...modules.map(({ module, importAlias }) => `  "${module.pluginName}": ${importAlias}.TPlugin;`),
      '}',
    ].join('\n')
  }
}
