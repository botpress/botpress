import {
  StateDefinition,
  RecurringEventDefinition,
  EventDefinition,
  ConfigurationDefinition,
  UserDefinition,
  ConversationDefinition,
  MessageDefinition,
  ActionDefinition,
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
} from '../bot/definition'

type BaseConfig = AnyZodObject
type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, AnyZodObject>

export type PluginDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions
> = {
  name: string
  version: string
  integrations?: {
    [K: string]: IntegrationPackage
  }
  interfaces?: {
    [K: string]: InterfacePackage
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
}

export class PluginDefinition<
  TConfig extends BaseConfig = BaseConfig,
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
  public constructor(public readonly props: PluginDefinitionProps<TConfig, TStates, TEvents, TActions>) {
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

  public dependency(pkg: IntegrationPackage | InterfacePackage): this {
    const self = this as Writable<PluginDefinition>

    if (pkg.type === 'integration') {
      if (!self.integrations) {
        self.integrations = {}
      }
      self.integrations[pkg.definition.name] = pkg
      return this
    }

    if (pkg.type === 'interface') {
      if (!self.interfaces) {
        self.interfaces = {}
      }
      self.interfaces[pkg.definition.name] = pkg
      return this
    }

    return this
  }
}
