import {
  StateDefinition,
  RecurringEventDefinition,
  EventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition,
  IntegrationConfigInstance,
  IntegrationInstance,
  InterfaceInstance,
} from '../bot/definition'
import { IntegrationPackage, InterfacePackage } from '../package'
import { Writable } from '../utils/type-utils'
import { AnyZodObject } from '../zui'

export {
  StateDefinition,
  RecurringEventDefinition,
  EventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition,
  IntegrationConfigInstance,
  IntegrationInstance as IntegrationInstance,
} from '../bot/definition'

type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, AnyZodObject>

export type PluginDefinitionProps<
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions
> = {
  name: string
  version: string
  integrations?: {
    [K: string]: IntegrationInstance
  }
  interfaces?: {
    [K: string]: InterfaceInstance
  }
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }
  configuration?: ConfigurationDefinition
  events?: {
    [K in keyof TEvents]: EventDefinition<TEvents[K]>
  }
  recurringEvents?: Record<string, RecurringEventDefinition<TEvents>>
  actions?: {
    [K in keyof TActions]: ActionDefinition<TActions[K]>
  }
}

export class PluginDefinition<
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions
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
  public constructor(public readonly props: PluginDefinitionProps<TStates, TEvents, TActions>) {
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
  }

  public addIntegration<I extends IntegrationPackage>(integrationPkg: I, config: IntegrationConfigInstance<I>): this {
    const self = this as Writable<PluginDefinition>
    if (!self.integrations) {
      self.integrations = {}
    }

    self.integrations[integrationPkg.definition.name] = {
      enabled: config.enabled,
      ...integrationPkg,
      configurationType: config.configurationType as string,
      configuration: config.configuration,
    }
    return this
  }

  public addInterface<I extends InterfacePackage>(interfacePkg: I): this {
    const self = this as Writable<PluginDefinition>
    if (!self.interfaces) {
      self.interfaces = {}
    }

    self.interfaces[interfacePkg.definition.name] = interfacePkg
    return this
  }
}
