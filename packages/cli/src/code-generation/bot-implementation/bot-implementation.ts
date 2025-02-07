import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { Module } from '../module'
import { BotPluginsIndexModule } from './bot-plugins'
import { BotTypingsModule } from './bot-typings'

export class BotImplementationModule extends Module {
  private _typingsModule: BotTypingsModule
  private _pluginsModule: BotPluginsIndexModule

  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'Bot',
      path: consts.INDEX_FILE,
    })

    this._typingsModule = new BotTypingsModule(bot)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)

    this._pluginsModule = new BotPluginsIndexModule(bot)
    this._pluginsModule.unshift(consts.fromOutDir.pluginsDir)
    this.pushDep(this._pluginsModule)
  }

  public async getContent() {
    const {
      //
      _typingsModule: typingsModule,
      _pluginsModule: pluginsModule,
    } = this

    const typingsImport = typingsModule.import(this)
    const pluginsImport = pluginsModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${typingsModule.name} from "./${typingsImport}"`,
      `import * as ${pluginsModule.name} from "./${pluginsImport}"`,
      '',
      `export * from "./${typingsImport}"`,
      `export * from "./${pluginsImport}"`,
      '',
      `type TPlugins = ${pluginsModule.name}.TPlugins`,
      `type TBot = sdk.DefaultBot<${typingsModule.name}.${typingsModule.exportName}>`,
      '',
      'export type BotProps = {',
      '  actions: sdk.BotProps<TBot, TPlugins>["actions"]',
      '}',
      '',
      'export class Bot extends sdk.Bot<TBot, TPlugins> {',
      '  public constructor(props: BotProps) {',
      '    super({',
      '      actions: props.actions,',
      `      plugins: ${pluginsModule.name}.${pluginsModule.exportName}`,
      '    })',
      '  }',
      '}',
      '',
      '// extra types',
      '',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      '',
      'export type BotHandlers = sdk.BotHandlers<TBot>',
      '',
      'export type EventHandlers = Required<{',
      "  [K in keyof BotHandlers['eventHandlers']]: NonNullable<BotHandlers['eventHandlers'][K]>[number]",
      '}>',
      'export type MessageHandlers = Required<{',
      "  [K in keyof BotHandlers['messageHandlers']]: NonNullable<BotHandlers['messageHandlers'][K]>[number]",
      '}>',
      '',
      "export type MessageHandlerProps = Parameters<MessageHandlers['*']>[0]",
      "export type EventHandlerProps = Parameters<EventHandlers['*']>[0]",
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
