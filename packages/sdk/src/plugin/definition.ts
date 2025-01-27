import {
  StateDefinition,
  RecurringEventDefinition,
  EventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition,
  TableDefinition,
} from '../bot/definition'
import { IntegrationPackage, InterfacePackage } from '../package'
import { ZuiObjectSchema } from '../zui'

export {
  StateDefinition,
  RecurringEventDefinition,
  EventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition,
  TableDefinition,
  IntegrationConfigInstance,
} from '../bot/definition'

type BaseConfig = ZuiObjectSchema
type BaseStates = Record<string, ZuiObjectSchema>
type BaseEvents = Record<string, ZuiObjectSchema>
type BaseActions = Record<string, ZuiObjectSchema>
type BaseInterfaces = Record<string, any>
type BaseIntegrations = Record<string, any>
type BaseTables = Record<string, ZuiObjectSchema>

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
> = {
  name: TName
  version: TVersion
  integrations?: {
    [K in keyof TIntegrations]: IntegrationPackage
  }
  interfaces?: {
    [K in keyof TInterfaces]: InterfacePackage
  }
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }
  configuration?: ConfigurationDefinition<TConfig>
  events?: {
    [K in keyof TEvents]: EventDefinition<TEvents[K]>
  }
  recurringEvents?: Record<string, RecurringEventDefinition<TEvents>>
  actions?: {
    [K in keyof TActions]: ActionDefinition<TActions[K]>
  }
  tables?: {
    [K in keyof TTables]: TableDefinition<TTables[K]>
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
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']

  public readonly integrations: this['props']['integrations']
  public readonly interfaces: this['props']['interfaces']

  public readonly user: this['props']['user']
  public readonly conversation: this['props']['conversation']
  public readonly message: this['props']['message']
  public readonly states: this['props']['states']
  public readonly configuration: this['props']['configuration']
  public readonly events: this['props']['events']
  public readonly recurringEvents: this['props']['recurringEvents']
  public readonly actions: this['props']['actions']
  public readonly tables: this['props']['tables']

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
      TTables
    >
  ) {
    this.name = props.name
    this.version = props.version
    this.integrations = props.integrations
    this.interfaces = props.interfaces
    this.user = props.user
    this.conversation = props.conversation
    this.message = props.message
    this.states = props.states
    this.configuration = props.configuration
    this.events = props.events
    this.recurringEvents = props.recurringEvents
    this.actions = props.actions
    this.tables = props.tables
  }
}
