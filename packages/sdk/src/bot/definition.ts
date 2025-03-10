import { Table } from '@botpress/client'
import { IntegrationPackage, PluginPackage } from '../package'
import { PluginInterfaceExtension } from '../plugin'
import { SchemaDefinition } from '../schema'
import * as utils from '../utils'
import { ValueOf, Writable, Merge } from '../utils/type-utils'
import z, { ZuiObjectSchema } from '../zui'

type BaseConfig = ZuiObjectSchema
type BaseStates = Record<string, ZuiObjectSchema>
type BaseEvents = Record<string, ZuiObjectSchema>
type BaseActions = Record<string, ZuiObjectSchema>
type BaseTables = Record<string, ZuiObjectSchema>

export type TagDefinition = {
  title?: string
  description?: string
}

export type StateType = 'conversation' | 'user' | 'bot'

export type StateDefinition<TState extends BaseStates[string] = BaseStates[string]> = SchemaDefinition<TState> & {
  type: StateType
  expiry?: number
}

export type RecurringEventDefinition<TEvents extends BaseEvents = BaseEvents> = {
  [K in keyof TEvents]: {
    type: K
    payload: z.infer<TEvents[K]>
    schedule: { cron: string }
  }
}[keyof TEvents]

export type EventDefinition<TEvent extends BaseEvents[string] = BaseEvents[string]> = SchemaDefinition<TEvent>

export type ConfigurationDefinition<TConfig extends BaseConfig = BaseConfig> = SchemaDefinition<TConfig>

export type UserDefinition = {
  tags?: Record<string, TagDefinition>
}

export type ConversationDefinition = {
  tags?: Record<string, TagDefinition>
}

export type MessageDefinition = {
  tags?: Record<string, TagDefinition>
}

export type ActionDefinition<TAction extends BaseActions[string] = BaseActions[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction>
  output: SchemaDefinition<ZuiObjectSchema> // cannot infer both input and output types (typescript limitation)
}

export type TableDefinition<TTable extends BaseTables[string] = BaseTables[string]> = Merge<
  Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'name'>,
  {
    schema: TTable
  }
>

export type IntegrationConfigInstance<I extends IntegrationPackage = IntegrationPackage> = {
  enabled: boolean
} & (
  | {
      configurationType?: null
      configuration: z.infer<NonNullable<I['definition']['configuration']>['schema']>
    }
  | ValueOf<{
      [K in keyof NonNullable<I['definition']['configurations']>]: {
        configurationType: K
        configuration: z.infer<NonNullable<I['definition']['configurations']>[K]['schema']>
      }
    }>
)

export type PluginConfigInstance<P extends PluginPackage = PluginPackage> = {
  alias?: string
  configuration: z.infer<NonNullable<P['definition']['configuration']>['schema']>
  interfaces: {
    [I in keyof NonNullable<P['definition']['interfaces']>]: PluginInterfaceExtension
  }
}

export type IntegrationInstance = IntegrationPackage & IntegrationConfigInstance
export type PluginInstance = PluginPackage & PluginConfigInstance

export type BotDefinitionProps<
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TTables extends BaseTables = BaseTables,
> = {
  integrations?: {
    [K: string]: IntegrationInstance
  }
  plugins?: {
    [K: string]: PluginInstance
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
  tables?: {
    [K in keyof TTables]: TableDefinition<TTables[K]>
  }
}

export class BotDefinition<
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TTables extends BaseTables = BaseTables,
> {
  public readonly integrations: this['props']['integrations']
  public readonly plugins: this['props']['plugins']
  public readonly user: this['props']['user']
  public readonly conversation: this['props']['conversation']
  public readonly message: this['props']['message']
  public readonly states: this['props']['states']
  public readonly configuration: this['props']['configuration']
  public readonly events: this['props']['events']
  public readonly recurringEvents: this['props']['recurringEvents']
  public readonly actions: this['props']['actions']
  public readonly tables: this['props']['tables']
  public constructor(public readonly props: BotDefinitionProps<TStates, TEvents, TActions, TTables>) {
    this.integrations = props.integrations
    this.plugins = props.plugins
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

  public addIntegration<I extends IntegrationPackage>(integrationPkg: I, config: IntegrationConfigInstance<I>): this {
    const self = this as Writable<BotDefinition>
    if (!self.integrations) {
      self.integrations = {}
    }

    self.integrations[integrationPkg.name] = {
      enabled: config.enabled,
      ...integrationPkg,
      configurationType: config.configurationType as string,
      configuration: config.configuration,
    }
    return this
  }

  public addPlugin<P extends PluginPackage>(pluginPkg: P, config: PluginConfigInstance<P>): this {
    const self = this as Writable<BotDefinition>
    if (!self.plugins) {
      self.plugins = {}
    }

    // TODO: ensure that plugin alias does not conflict an interface or integration

    self.plugins[pluginPkg.name] = {
      ...pluginPkg,
      alias: config.alias,
      configuration: config.configuration,
      interfaces: config.interfaces,
    }

    self.user = this._mergeUser(self.user, pluginPkg.definition.user) // TODO: adress user tags collision between plugins
    self.conversation = this._mergeConversation(self.conversation, pluginPkg.definition.conversation) // TODO: adress conversation tags collision between plugins
    self.message = this._mergeMessage(self.message, pluginPkg.definition.message) // TODO: adress message tags collision between plugins
    self.recurringEvents = this._mergeRecurringEvents(self.recurringEvents, pluginPkg.definition.recurringEvents) // TODO: adress recurring events collision between plugins
    self.tables = this._mergeTables(self.tables, pluginPkg.definition.tables) // TODO: adress tables collision between plugins

    self.states = this._mergeStates(self.states, this._prefixKeys(pluginPkg.definition.states, config.alias))
    self.events = this._mergeEvents(self.events, this._prefixKeys(pluginPkg.definition.events, config.alias))
    self.actions = this._mergeActions(self.actions, this._prefixKeys(pluginPkg.definition.actions, config.alias))

    return this
  }

  private _mergeUser = (
    user1: BotDefinitionProps['user'],
    user2: BotDefinitionProps['user']
  ): BotDefinitionProps['user'] => {
    return {
      tags: {
        ...user1?.tags,
        ...user2?.tags,
      },
    }
  }

  private _mergeConversation = (
    conversation1: BotDefinitionProps['conversation'],
    conversation2: BotDefinitionProps['conversation']
  ): BotDefinitionProps['conversation'] => {
    return {
      tags: {
        ...conversation1?.tags,
        ...conversation2?.tags,
      },
    }
  }

  private _mergeMessage = (
    message1: BotDefinitionProps['message'],
    message2: BotDefinitionProps['message']
  ): BotDefinitionProps['message'] => {
    return {
      tags: {
        ...message1?.tags,
        ...message2?.tags,
      },
    }
  }

  private _mergeStates = (
    states1: BotDefinitionProps['states'],
    states2: BotDefinitionProps['states']
  ): BotDefinitionProps['states'] => {
    return {
      ...states1,
      ...states2,
    }
  }

  private _mergeEvents = (
    events1: BotDefinitionProps['events'],
    events2: BotDefinitionProps['events']
  ): BotDefinitionProps['events'] => {
    return {
      ...events1,
      ...events2,
    }
  }

  private _mergeRecurringEvents = (
    recurringEvents1: BotDefinitionProps['recurringEvents'],
    recurringEvents2: BotDefinitionProps['recurringEvents']
  ): BotDefinitionProps['recurringEvents'] => {
    return {
      ...recurringEvents1,
      ...recurringEvents2,
    }
  }

  private _mergeActions = (
    actions1: BotDefinitionProps['actions'],
    actions2: BotDefinitionProps['actions']
  ): BotDefinitionProps['actions'] => {
    return {
      ...actions1,
      ...actions2,
    }
  }

  private _mergeTables = (
    tables1: BotDefinitionProps['tables'],
    tables2: BotDefinitionProps['tables']
  ): BotDefinitionProps['tables'] => {
    return {
      ...tables1,
      ...tables2,
    }
  }

  private _prefixKeys = <T extends Record<string, any> | undefined>(obj: T, alias: string | undefined): T => {
    if (!obj || !alias) {
      return obj
    }
    return utils.records.mapKeys(obj, (key) => `${alias}:${key}`) as T
  }
}
