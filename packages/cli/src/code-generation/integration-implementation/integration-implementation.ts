import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { Module } from '../module'
import { IntegrationTypingsModule } from './integration-typings'

export class IntegrationImplementationModule extends Module {
  private _typingsModule: IntegrationTypingsModule

  public constructor(integration: sdk.IntegrationDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: 'Integration',
    })
    this._typingsModule = new IntegrationTypingsModule(integration)
    this._typingsModule.unshift('typings')
    this.pushDep(this._typingsModule)
  }

  public async getContent() {
    let content = ''

    const typingsImport = this._typingsModule.import(this)

    content += [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `export * from "./${typingsImport}"`,
      '',
      `type TIntegration = sdk.DefaultIntegration<${this._typingsModule.name}.${this._typingsModule.exportName}>`,
      '',
      'export type IntegrationProps = sdk.IntegrationProps<TIntegration>',
      '',
      'export class Integration extends sdk.Integration<TIntegration> {}',
      '',
      'export type Client = sdk.IntegrationSpecificClient<TIntegration>',
      '',
      '// extra types',
      '',
      'type Cast<X, Y> = X extends Y ? X : Y',
      'type ValueOf<T> = T[keyof T]',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      '',
      "export type HandlerProps = Parameters<IntegrationProps['handler']>[0]",
      '',
      'export type ActionProps = {',
      "  [K in keyof IntegrationProps['actions']]: Parameters<IntegrationProps['actions'][K]>[0]",
      '}',
      'export type AnyActionProps = ValueOf<ActionProps>',
      '',
      'export type MessageProps = {',
      "  [TChannel in keyof IntegrationProps['channels']]: {",
      "    [TMessage in keyof IntegrationProps['channels'][TChannel]['messages']]: Parameters<",
      "      IntegrationProps['channels'][TChannel]['messages'][TMessage]",
      '    >[0]',
      '  }',
      '}',
      'export type AnyMessageProps = ValueOf<ValueOf<MessageProps>>',
      '',
      "export type Context = HandlerProps['ctx']",
      "export type Logger = HandlerProps['logger']",
      '',
      'export type AckFunctions = {',
      '  [TChannel in keyof MessageProps]: {',
      "    [TMessage in keyof MessageProps[TChannel]]: Cast<MessageProps[TChannel][TMessage], AnyMessageProps>['ack']",
      '  }',
      '}',
      'export type AnyAckFunction = ValueOf<ValueOf<AckFunctions>>',
      '',
      'export type ClientOperation = ValueOf<{',
      '  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: K',
      '}>',
      'export type ClientRequests = {',
      '  [K in ClientOperation]: Parameters<Client[K]>[0]',
      '}',
      'export type ClientResponses = {',
      '  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>',
      '}',
    ].join('\n')

    return content
  }
}
