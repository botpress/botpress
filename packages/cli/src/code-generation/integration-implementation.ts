import { GENERATED_HEADER, INDEX_FILE } from './const'
import { stringifySingleLine } from './generators'
import { ActionsModule } from './integration-schemas/actions-module'
import { ChannelsModule } from './integration-schemas/channels-module'
import { ConfigurationModule } from './integration-schemas/configuration-module'
import { EntitiesModule } from './integration-schemas/entities-module'
import { EventsModule } from './integration-schemas/events-module'
import { StatesModule } from './integration-schemas/states-module'
import { Module, ModuleDef } from './module'
import * as types from './typings'

export class IntegrationImplementationIndexModule extends Module {
  public static async create(integration: types.IntegrationDefinition): Promise<IntegrationImplementationIndexModule> {
    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: {} })
    configModule.unshift('configuration')

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const statesModule = await StatesModule.create(integration.states ?? {})
    statesModule.unshift('states')

    const entitiesModule = await EntitiesModule.create(integration.entities ?? {})
    entitiesModule.unshift('entities')

    const inst = new IntegrationImplementationIndexModule(
      integration,
      configModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
      entitiesModule,
      {
        path: INDEX_FILE,
        exportName: 'Integration',
        content: '',
      }
    )

    inst.pushDep(configModule)
    inst.pushDep(actionsModule)
    inst.pushDep(channelsModule)
    inst.pushDep(eventsModule)
    inst.pushDep(statesModule)
    inst.pushDep(entitiesModule)
    return inst
  }

  private constructor(
    private integration: types.IntegrationDefinition,
    private configModule: ConfigurationModule,
    private actionsModule: ActionsModule,
    private channelsModule: ChannelsModule,
    private eventsModule: EventsModule,
    private statesModule: StatesModule,
    private entitiesModule: EntitiesModule,
    def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    let content = GENERATED_HEADER

    const { configModule, actionsModule, channelsModule, eventsModule, statesModule, entitiesModule, integration } =
      this

    const configImport = configModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const entitiesImport = entitiesModule.import(this)

    content += [
      GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import type * as ${configModule.name} from "./${configImport}"`,
      `import type * as ${actionsModule.name} from "./${actionsImport}"`,
      `import type * as ${channelsModule.name} from "./${channelsImport}"`,
      `import type * as ${eventsModule.name} from "./${eventsImport}"`,
      `import type * as ${statesModule.name} from "./${statesImport}"`,
      `import type * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${configModule.name} from "./${configImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      '',
      '// type utils',
      'type Cast<X, Y> = X extends Y ? X : Y',
      'type ValueOf<T> = T[keyof T]',
      'type AsyncFunction = (...args: any[]) => Promise<any>',
      'type SimplifyObject<T extends object> = T extends infer O ? { [K in keyof O]: Simplify<O[K]> } : never',
      'type Simplify<T> = T extends (...args: infer A) => infer R',
      '  ? (...args: Simplify<A>) => Simplify<R>',
      '  : T extends Buffer',
      '  ? Buffer',
      '  : T extends Promise<infer R>',
      '  ? Promise<Simplify<R>>',
      '  : T extends object',
      '  ? SimplifyObject<T>',
      '  : T',
      '',
      'type TIntegration = {',
      `  name: "${integration.name}"`,
      `  version: "${integration.version}"`,
      `  configuration: ${configModule.name}.${configModule.exports}`,
      `  actions: ${actionsModule.name}.${actionsModule.exports}`,
      `  channels: ${channelsModule.name}.${channelsModule.exports}`,
      `  events: ${eventsModule.name}.${eventsModule.exports}`,
      `  states: ${statesModule.name}.${statesModule.exports}`,
      `  user: ${stringifySingleLine(integration.user)}`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exports}`,
      '}',
      '',
      'export type IntegrationProps = sdk.IntegrationProps<TIntegration>',
      '',
      'export class Integration extends sdk.Integration<TIntegration> {}',
      '',
      'export type Client = sdk.IntegrationSpecificClient<TIntegration>',
      '',
      '// extra types',
      '',
      "export type HandlerProps = Simplify<Parameters<IntegrationProps['handler']>[0]>",
      '',
      'export type ActionProps = Simplify<{',
      "  [K in keyof IntegrationProps['actions']]: Parameters<IntegrationProps['actions'][K]>[0]",
      '}>',
      'export type AnyActionProps = ValueOf<ActionProps>',
      '',
      'export type MessageProps = Simplify<{',
      "  [TChannel in keyof IntegrationProps['channels']]: {",
      "    [TMessage in keyof IntegrationProps['channels'][TChannel]['messages']]: Parameters<",
      "      IntegrationProps['channels'][TChannel]['messages'][TMessage]",
      '    >[0]',
      '  }',
      '}>',
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
      'export type ClientOperation = Simplify<ValueOf<{',
      '  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: K',
      '}>>',
      'export type ClientRequests = Simplify<{',
      '  [K in ClientOperation]: Parameters<Client[K]>[0]',
      '}>',
      'export type ClientResponses = Simplify<{',
      '  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>',
      '}>',
    ].join('\n')

    return content
  }
}
