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
      '// extra types',
      '',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      "export type EventHandler = Parameters<Plugin['event']>[0]",
      'export type EventHandlerProps = Parameters<EventHandler>[0]',
      "export type MessageHandler = Parameters<Plugin['message']>[0]",
      'export type MessageHandlerProps = Parameters<MessageHandler>[0]',
      "export type Client = EventHandlerProps['client']",
      'export type ClientOperation = keyof {',
      '  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: null',
      '}',
      'export type ClientInputs = {',
      '  [K in ClientOperation]: Parameters<Client[K]>[0]',
      '}',
      'export type ClientOutputs = {',
      '  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>',
      '}',
      '// @deprecated',
      "export type PluginEvent = EventHandlerProps['event']",
      '// @deprecated',
      'export type PluginEvents = {',
      "  [K in PluginEvent['type']]: Extract<PluginEvent, { type: K }>",
      '}',
      '// @deprecated',
      "export type PluginState = ClientOutputs['getState']['state']",
      '// @deprecated',
      'export type PluginStates = {',
      "  [K in PluginState['name']]: Extract<PluginState, { type: K }>['payload']",
      '}',
    ].join('\n')
  }
}
