import {
  StateDefinition as BotStateDefinition,
  EventDefinition as BotEventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition as BotActionDefinition,
  TableDefinition as BotTableDefinition,
  WorkflowDefinition,
} from '../bot/definition'
import { IntegrationPackage, InterfacePackage } from '../package'
import * as typeUtils from '../utils/type-utils'
import { ZuiObjectSchema, ZuiObjectOrRefSchema, z } from '../zui'

export {
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  IntegrationConfigInstance,
  WorkflowDefinition,
} from '../bot/definition'

type BaseConfig = ZuiObjectSchema
type BaseStates = Record<string, ZuiObjectOrRefSchema>
type BaseEvents = Record<string, ZuiObjectOrRefSchema>
type BaseActions = Record<string, ZuiObjectOrRefSchema>
type BaseInterfaces = Record<string, InterfacePackage>
type BaseIntegrations = Record<string, IntegrationPackage>
type BaseTables = Record<string, ZuiObjectOrRefSchema>
type BaseWorkflows = Record<string, ZuiObjectSchema>

export type TableDefinition<TTable extends BaseTables[string] = BaseTables[string]> = typeUtils.Merge<
  BotTableDefinition,
  {
    schema: TTable
  }
>

export type StateDefinition<TState extends BaseStates[string] = BaseStates[string]> = typeUtils.Merge<
  BotStateDefinition,
  {
    schema: TState
  }
>

export type EventDefinition<TEvent extends BaseEvents[string] = BaseEvents[string]> = typeUtils.Merge<
  BotEventDefinition,
  {
    schema: TEvent
  }
>

export type ActionDefinition<TAction extends BaseActions[string] = BaseActions[string]> = typeUtils.Merge<
  BotActionDefinition,
  {
    input: { schema: TAction }
    output: { schema: ZuiObjectOrRefSchema }
  }
>

export type RecurringEventDefinition<TEvents extends BaseEvents = BaseEvents> = {
  [K in keyof TEvents]: TEvents[K] extends ZuiObjectSchema
    ? {
        type: K
        payload: z.infer<TEvents[K]>
        schedule: {
          cron: string
        }
      }
    : never
}[keyof TEvents]

export type ZuiSchemaWithEntityReferences<
  TInterfaces extends BaseInterfaces,
  TReturnType extends ZuiObjectOrRefSchema,
> =
  | ((props: {
      entities: {
        [TInterfaceAlias in keyof TInterfaces]: {
          [TEntityName in keyof TInterfaces[TInterfaceAlias]['definition']['entities']]: z.ZodRef
        }
      }
    }) => TReturnType)
  | TReturnType

type GenericDefinition<
  TInterfaces extends BaseInterfaces,
  TDefinition extends { schema: ZuiObjectOrRefSchema },
> = typeUtils.Merge<
  TDefinition,
  {
    schema: ZuiSchemaWithEntityReferences<TInterfaces, TDefinition['schema']>
  }
>

type GenericNestedDefinition<
  TInterfaces extends BaseInterfaces,
  TDefinition extends { [k: string]: any },
  TKeys extends string,
> = Omit<TDefinition, TKeys> & {
  [TKey in TKeys]: Omit<TDefinition[TKey], 'schema'> & {
    schema: ZuiSchemaWithEntityReferences<TInterfaces, TDefinition[TKey]['schema']>
  }
}

export type PluginDefinitionProps<
  TName extends string = string,
  TVersion extends string = string,
  TConfig extends BaseConfig = BaseConfig,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TInterfaces extends BaseInterfaces = BaseInterfaces,
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TTables extends BaseTables = BaseTables,
  TWorkflows extends BaseWorkflows = BaseWorkflows,
> = {
  name: TName
  version: TVersion

  title?: string
  description?: string
  icon?: string
  readme?: string

  attributes?: Record<string, string>

  integrations?: TIntegrations
  interfaces?: TInterfaces
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: {
    [K in keyof TStates]: GenericDefinition<TInterfaces, StateDefinition<TStates[K]>>
  }
  configuration?: ConfigurationDefinition<TConfig>
  events?: {
    [K in keyof TEvents]: GenericDefinition<TInterfaces, EventDefinition<TEvents[K]>>
  }
  recurringEvents?: Record<string, RecurringEventDefinition<TEvents>>
  actions?: {
    [K in keyof TActions]: GenericNestedDefinition<TInterfaces, ActionDefinition<TActions[K]>, 'input' | 'output'>
  }
  tables?: {
    [K in keyof TTables]: GenericDefinition<TInterfaces, TableDefinition<TTables[K]>>
  }

  /**
   * # EXPERIMENTAL
   * This API is experimental and may change in the future.
   */
  workflows?: {
    [K in keyof TWorkflows]: WorkflowDefinition<TWorkflows[K]>
  }
}

export class PluginDefinition<
  TName extends string = string,
  TVersion extends string = string,
  TConfig extends BaseConfig = BaseConfig,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TInterfaces extends BaseInterfaces = BaseInterfaces,
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TTables extends BaseTables = BaseTables,
  TWorkflows extends BaseWorkflows = BaseWorkflows,
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']

  public readonly title: this['props']['title']
  public readonly description: this['props']['description']
  public readonly icon: this['props']['icon']
  public readonly readme: this['props']['readme']

  public readonly attributes: this['props']['attributes']

  public readonly integrations: this['props']['integrations']
  public readonly interfaces: this['props']['interfaces']

  public readonly user: this['props']['user']
  public readonly conversation: this['props']['conversation']
  public readonly message: this['props']['message']
  public readonly states: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }
  public readonly configuration: this['props']['configuration']
  public readonly events: {
    [K in keyof TEvents]: EventDefinition<TEvents[K]>
  }
  public readonly recurringEvents: this['props']['recurringEvents']
  public readonly actions: {
    [K in keyof TActions]: ActionDefinition<TActions[K]>
  }
  public readonly tables: {
    [K in keyof TTables]: TableDefinition<TTables[K]>
  }
  public readonly workflows: this['props']['workflows']

  public constructor(
    public readonly props: PluginDefinitionProps<
      TName,
      TVersion,
      TConfig,
      TStates,
      TEvents,
      TActions,
      TInterfaces,
      TIntegrations,
      TTables,
      TWorkflows
    >
  ) {
    // entities.<interfaceAlias>.<entityName> -> ZodRef
    const entities = Object.fromEntries(
      Object.entries(props.interfaces ?? {}).map(([interfaceAlias, interfaceDef]) => [
        interfaceAlias,
        Object.fromEntries(
          Object.entries(interfaceDef.definition.entities ?? {}).map(([entityName]) => [
            entityName,
            z.ref(`interface:${interfaceAlias}/entities/${entityName}`),
          ])
        ),
      ])
    ) as {
      [TInterfaceAlias in keyof TInterfaces]: {
        [TEntityName in keyof TInterfaces[TInterfaceAlias]['definition']['entities']]: z.ZodRef
      }
    }

    this.name = props.name
    this.version = props.version
    this.icon = props.icon
    this.readme = props.readme
    this.title = props.title
    this.description = props.description
    this.integrations = props.integrations
    this.interfaces = props.interfaces
    this.user = props.user
    this.conversation = props.conversation
    this.message = props.message
    this.recurringEvents = props.recurringEvents
    this.workflows = props.workflows
    this.attributes = props.attributes
    this.configuration = props.configuration

    this.states = Object.fromEntries(
      Object.entries(props.states ?? {}).map(
        ([stateName, stateDef]: [keyof TStates, NonNullable<(typeof props)['states']>[keyof TStates]]) => [
          stateName,
          {
            ...stateDef,
            schema: typeof stateDef.schema === 'object' ? stateDef.schema : stateDef.schema({ entities }),
          } as StateDefinition<TStates[keyof TStates]>,
        ]
      )
    ) as { [K in keyof TStates]: StateDefinition<TStates[K]> }

    this.events = Object.fromEntries(
      Object.entries(props.events ?? {}).map(
        ([eventName, eventDef]: [keyof TEvents, NonNullable<(typeof props)['events']>[keyof TEvents]]) => [
          eventName,
          {
            ...eventDef,
            schema: typeof eventDef.schema === 'object' ? eventDef.schema : eventDef.schema({ entities }),
          } as EventDefinition<TEvents[keyof TEvents]>,
        ]
      )
    ) as { [K in keyof TEvents]: EventDefinition<TEvents[K]> }

    this.actions = Object.fromEntries(
      Object.entries(props.actions ?? {}).map(
        ([actionName, actionDef]: [keyof TActions, NonNullable<(typeof props)['actions']>[keyof TActions]]) => [
          actionName,
          {
            ...actionDef,
            input: {
              ...actionDef.input,
              schema:
                typeof actionDef.input.schema === 'object'
                  ? actionDef.input.schema
                  : actionDef.input.schema({ entities }),
            },
            output: {
              ...actionDef.output,
              schema:
                typeof actionDef.output.schema === 'object'
                  ? actionDef.output.schema
                  : actionDef.output.schema({ entities }),
            },
          } as ActionDefinition<TActions[keyof TActions]>,
        ]
      )
    ) as { [K in keyof TActions]: ActionDefinition<TActions[K]> }

    this.tables = Object.fromEntries(
      Object.entries(props.tables ?? {}).map(
        ([tableName, tableDef]: [keyof TTables, NonNullable<(typeof props)['tables']>[keyof TTables]]) => [
          tableName,
          {
            ...tableDef,
            schema: typeof tableDef.schema === 'object' ? tableDef.schema : tableDef.schema({ entities }),
          } as TableDefinition<TTables[keyof TTables]>,
        ]
      )
    ) as { [K in keyof TTables]: TableDefinition<TTables[K]> }
  }
}
