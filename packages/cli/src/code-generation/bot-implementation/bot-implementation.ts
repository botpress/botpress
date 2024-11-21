import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { Module } from '../module'
import { BotTypingsModule } from './bot-typings'

export class BotImplementationModule extends Module {
  private _typingsModule: BotTypingsModule

  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'Bot',
      path: consts.INDEX_FILE,
    })

    this._typingsModule = new BotTypingsModule(bot)
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
      `type TBot = sdk.DefaultBot<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      'export class Bot extends sdk.Bot<TBot> {}',
      '',
      '// extra types',
      '',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      'export type EventHandlers = Required<{',
      "  [K in keyof Bot['eventHandlers']]: NonNullable<Bot['eventHandlers'][K]>[number]",
      '}>',
      'export type MessageHandlers = Required<{',
      "  [K in keyof Bot['messageHandlers']]: NonNullable<Bot['messageHandlers'][K]>[number]",
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
