import * as sdk from '@botpress/sdk'
import { BotTypingsModule } from './bot-schemas'
import * as consts from './const'
import { Module } from './module'

export class BotTypingsIndexModule extends Module {
  private _typingsModule: BotTypingsModule

  public constructor(bot: sdk.BotDefinition) {
    super({
      exportName: 'Bot',
      path: consts.INDEX_FILE,
    })

    this._typingsModule = new BotTypingsModule(bot, { fileName: 'typings.ts' })
    this.pushDep(this._typingsModule)
  }

  public async getContent() {
    const typingsImport = this._typingsModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import type * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `export * from "./${typingsImport}"`,
      '',
      `type TBot = ${this._typingsModule.name}.${this._typingsModule.exportName}`,
      '',
      'export class Bot extends sdk.Bot<TBot> {}',
      '',
      '// extra types',
      '',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      "export type EventHandler = Parameters<Bot['event']>[0]",
      'export type EventHandlerProps = Parameters<EventHandler>[0]',
      "export type MessageHandler = Parameters<Bot['message']>[0]",
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
      "export type BotEvent = EventHandlerProps['event']",
      'export type BotEvents = {',
      "  [K in BotEvent['type']]: Extract<BotEvent, { type: K }>",
      '}',
      "export type BotState = ClientOutputs['getState']['state']",
      'export type BotStates = {',
      "  [K in BotState['name']]: Extract<BotState, { type: K }>['payload']",
      '}',
    ].join('\n')
  }
}
