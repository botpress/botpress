import { GENERATED_HEADER, INDEX_FILE } from './const'
import { IntegrationTypingsModule } from './integration-schemas'
import { Module } from './module'
import * as types from './typings'

export class IntegrationTypingsIndexModule extends Module {
  private _typingsModule: IntegrationTypingsModule

  public constructor(integration: types.IntegrationDefinition) {
    super({
      path: INDEX_FILE,
      exportName: 'Integration',
    })
    this._typingsModule = new IntegrationTypingsModule(integration, { fileName: 'typings.ts' })
    this.pushDep(this._typingsModule)
  }

  public async getContent() {
    let content = ''

    const typingsImport = this._typingsModule.import(this)

    content += [
      GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      `import type * as ${this._typingsModule.name} from "./${typingsImport}"`,
      `export * from "./${typingsImport}"`,
      '',
      `type TIntegration = ${this._typingsModule.name}.${this._typingsModule.exportName}`,
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
