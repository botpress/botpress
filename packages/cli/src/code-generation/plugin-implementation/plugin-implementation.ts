import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { Module } from '../module'
import { PluginTypingsModule } from './plugin-typings'

export class PluginImplementationModule extends Module {
  private _typingsModule: PluginTypingsModule

  public constructor(plugin: sdk.PluginDefinition) {
    super({
      exportName: 'Plugin',
      path: consts.INDEX_FILE,
    })

    this._typingsModule = new PluginTypingsModule(plugin)
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
      `type TPlugin = sdk.DefaultPlugin<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      'export class Plugin extends sdk.Plugin<TPlugin> {}',
      '',
      'export type PluginProps = sdk.PluginProps<TPlugin>',
      'export type PluginRuntimeProps = sdk.PluginRuntimeProps<TPlugin>',
      '',
      '// extra types',
      '',
      'type ValueOf<T> = T[keyof T]',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      '',
      'export type PluginHandlers = sdk.PluginHandlers<TPlugin>',
      '',
      'export type EventHandlers = Required<{',
      "  [K in keyof PluginHandlers['eventHandlers']]: NonNullable<PluginHandlers['eventHandlers'][K]>[number]",
      '}>',
      'export type MessageHandlers = Required<{',
      "  [K in keyof PluginHandlers['messageHandlers']]: NonNullable<PluginHandlers['messageHandlers'][K]>[number]",
      '}>',
      'export type HookHandlers = Required<{',
      "  [H in keyof PluginHandlers['hookHandlers']]: {",
      "    [K in keyof PluginHandlers['hookHandlers'][H]]: NonNullable<PluginHandlers['hookHandlers'][H][K]>[number]",
      '  }',
      '}>',
      '',
      "export type AnyMessageHandler = MessageHandlers['*']",
      "export type AnyEventHandler = EventHandlers['*']",
      "export type AnyActionHandler = ValueOf<PluginHandlers['actionHandlers']>",
      'export type AnyHookHanders = {',
      "  [H in keyof HookHandlers]: HookHandlers[H]['*']",
      '}',
      '',
      'export type MessageHandlerProps = Parameters<AnyMessageHandler>[0]',
      'export type EventHandlerProps = Parameters<AnyEventHandler>[0]',
      'export type ActionHandlerProps = Parameters<AnyActionHandler>[0]',
      'export type HookHandlerProps = {',
      '  [H in keyof AnyHookHanders]: Parameters<NonNullable<AnyHookHanders[H]>>[0]',
      '}',
      '',
      "export type Client = (MessageHandlerProps | EventHandlerProps)['client']",
      'export type ClientOperation = keyof {',
      '  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: null',
      '}',
      'export type ClientInputs = {',
      '  [K in ClientOperation]: Parameters<Client[K]>[0]',
      '}',
      'export type ClientOutputs = {',
      '  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>',
      '}',
    ].join('\n')
  }
}
