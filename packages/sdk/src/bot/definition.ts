import { Table } from '@botpress/client'
import * as consts from '../consts'
import { IntegrationPackage, PluginPackage } from '../package'
import { PluginInterfaceExtension } from '../plugin'
import { SchemaDefinition } from '../schema'
import * as utils from '../utils'
import { ValueOf, Writable, Merge, StringKeys } from '../utils/type-utils'
import z, { ZuiObjectSchema, ZuiObjectOrRefSchema } from '../zui'

type BaseConfig = ZuiObjectSchema
type BaseStates = Record<string, ZuiObjectOrRefSchema>
type BaseEvents = Record<string, ZuiObjectOrRefSchema>
type BaseActions = Record<string, ZuiObjectOrRefSchema>
type BaseTables = Record<string, ZuiObjectOrRefSchema>
type BaseWorkflows = Record<string, ZuiObjectSchema>

export type TagDefinition = {
  title?: string
  description?: string
}

export type StateType = 'conversation' | 'user' | 'bot' | 'workflow'

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

export type EventDefinition<TEvent extends BaseEvents[string] = BaseEvents[string]> = SchemaDefinition<TEvent> & {
  attributes?: Record<string, string>
}

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
  output: SchemaDefinition<ZuiObjectOrRefSchema> // cannot infer both input and output types (typescript limitation)
  attributes?: Record<string, string>
}

export type WorkflowDefinition<TWorkflow extends BaseWorkflows[string] = BaseWorkflows[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TWorkflow>
  output: SchemaDefinition<ZuiObjectSchema> // cannot infer both input and output types (typescript limitation)
  tags?: Record<string, TagDefinition>
}

export type TableDefinition<TTable extends BaseTables[string] = BaseTables[string]> = Merge<
  Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'name'>,
  {
    schema: TTable
  }
>

export type IntegrationConfigInstance<I extends IntegrationPackage = IntegrationPackage> = {
  enabled: boolean
  disabledChannels?: StringKeys<NonNullable<I['definition']['channels']>>[]
} & (
  | {
      configurationType?: null
      configuration: z.infer<NonNullable<I['definition']['configuration']>['schema']>
    }
  | ValueOf<{
      [K in StringKeys<NonNullable<I['definition']['configurations']>>]: {
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
  TWorkflows extends BaseWorkflows = BaseWorkflows,
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

  /**
   * # EXPERIMENTAL
   * This API is experimental and may change in the future.
   */
  workflows?: {
    [K in keyof TWorkflows]: WorkflowDefinition<TWorkflows[K]>
  }

  attributes?: Record<string, string>
}

export class BotDefinition<
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TTables extends BaseTables = BaseTables,
  TWorkflows extends BaseWorkflows = BaseWorkflows,
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
  public readonly workflows: this['props']['workflows']
  public readonly attributes: this['props']['attributes']

  /** Bot definition with plugins merged into it */
  public readonly withPlugins: Pick<
    this['props'],
    'user' | 'conversation' | 'message' | 'states' | 'events' | 'recurringEvents' | 'actions' | 'tables' | 'workflows'
  >

  public constructor(public readonly props: BotDefinitionProps<TStates, TEvents, TActions, TTables, TWorkflows>) {
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
    this.workflows = props.workflows
    this.attributes = props.attributes

    this.withPlugins = {
      user: props.user,
      conversation: props.conversation,
      message: props.message,
      states: props.states,
      events: props.events,
      recurringEvents: props.recurringEvents,
      actions: props.actions,
      tables: props.tables,
      workflows: props.workflows,
    }
  }

  public addIntegration<I extends IntegrationPackage>(integrationPkg: I, config: IntegrationConfigInstance<I>): this {
    const self = this as Writable<BotDefinition>
    if (!self.integrations) {
      self.integrations = {}
    }

    self.integrations[integrationPkg.name] = {
      enabled: config.enabled,
      ...integrationPkg,
      configurationType: config.configurationType,
      configuration: config.configuration,
      disabledChannels: config.disabledChannels,
    }
    return this
  }

  public addPlugin<P extends PluginPackage>(pluginPkg: P, config: PluginConfigInstance<P>): this {
    const self = this as Writable<BotDefinition>
    if (!self.plugins) {
      self.plugins = {}
    }

    const pluginAlias = config.alias ?? pluginPkg.name.replace('/', '-')
    self.plugins[pluginAlias] = {
      ...pluginPkg,
      alias: pluginAlias,
      configuration: config.configuration,
      interfaces: config.interfaces,
    }

    self.withPlugins.user = this._mergeUser(self.withPlugins.user, pluginPkg.definition.user)
    self.withPlugins.conversation = this._mergeConversation(
      self.withPlugins.conversation,
      pluginPkg.definition.conversation
    )
    self.withPlugins.message = this._mergeMessage(self.withPlugins.message, pluginPkg.definition.message)
    self.withPlugins.recurringEvents = this._mergeRecurringEvents(
      self.withPlugins.recurringEvents,
      pluginPkg.definition.recurringEvents
    )
    self.withPlugins.tables = this._mergeTables(self.withPlugins.tables, pluginPkg.definition.tables)
    self.withPlugins.workflows = this._mergeWorkflows(self.withPlugins.workflows, pluginPkg.definition.workflows)

    self.withPlugins.states = this._mergeStates(
      self.withPlugins.states,
      this._prefixKeysWithPluginAlias(pluginPkg.definition.states, pluginAlias)
    )
    self.withPlugins.events = this._mergeEvents(
      self.withPlugins.events,
      this._prefixKeysWithPluginAlias(pluginPkg.definition.events, pluginAlias)
    )
    self.withPlugins.actions = this._mergeActions(
      self.withPlugins.actions,
      this._prefixKeysWithPluginAlias(pluginPkg.definition.actions, pluginAlias)
    )

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

  private _mergeWorkflows = (
    workflows1: BotDefinitionProps['workflows'],
    workflows2: BotDefinitionProps['workflows']
  ): BotDefinitionProps['workflows'] => {
    return {
      ...workflows1,
      ...workflows2,
    }
  }

  private _prefixKeysWithPluginAlias = <TRecord extends Record<string, unknown>>(
    obj: TRecord | undefined,
    pluginAlias: string
  ): TRecord =>
    utils.records.mapKeys(obj ?? {}, (key) => `${pluginAlias}${consts.PLUGIN_PREFIX_SEPARATOR}${key}`) as TRecord

  /**
   * Returns a copy of the bot definition where all interface entity references
   * are resolved to the base entity schema as extended by the backing
   * integration.
   */
  public dereferencePluginEntities(): this {
    const zuiReferenceMap = this._buildZuiReferenceMap()

    return {
      ...this,
      withPlugins: {
        ...this.withPlugins,
        events: this._dereferenceDefinitionSchemas(this.withPlugins.events, zuiReferenceMap),
        states: this._dereferenceDefinitionSchemas(this.withPlugins.states, zuiReferenceMap),
        tables: this._dereferenceDefinitionSchemas(this.withPlugins.tables, zuiReferenceMap),
        actions: this._dereferenceActionDefinitionSchemas(this.withPlugins.actions, zuiReferenceMap),
      },
      plugins: Object.fromEntries(
        (Object.entries(this.plugins ?? {}) as [pluginAlias: string, PluginInstance][]).map(
          ([pluginAlias, pluginInstance]) => [
            pluginAlias,
            {
              ...pluginInstance,
              definition: {
                ...pluginInstance.definition,
                configuration: this._dereferenceDefinitionSchema(
                  pluginInstance.definition.configuration,
                  zuiReferenceMap
                ),
                events: this._dereferenceDefinitionSchemas(pluginInstance.definition.events, zuiReferenceMap),
                states: this._dereferenceDefinitionSchemas(pluginInstance.definition.states, zuiReferenceMap),
                tables: this._dereferenceDefinitionSchemas(pluginInstance.definition.tables, zuiReferenceMap),
                actions: this._dereferenceActionDefinitionSchemas(pluginInstance.definition.actions, zuiReferenceMap),
              },
            },
          ]
        )
      ),
    } as typeof this
  }

  private _buildZuiReferenceMap(): Record<string, z.ZodTypeAny> {
    const zuiReferenceMap: Record<string, z.ZodTypeAny> = {}

    const installedPlugins = Object.entries(this.plugins ?? {}) as [pluginAlias: string, PluginInstance][]

    for (const [pluginAlias, pluginInstance] of installedPlugins) {
      const pluginInterfaceExtensions = Object.entries(pluginInstance.interfaces ?? {}) as [
        interfaceAlias: string,
        PluginInterfaceExtension,
      ][]

      for (const [interfaceAlias, pluginInterfaceExtension] of pluginInterfaceExtensions) {
        const backingIntegration = this.integrations?.[pluginInterfaceExtension.name]

        if (!backingIntegration) {
          throw new Error(
            `Interface with alias "${interfaceAlias}" of plugin with alias "${pluginAlias}" references integration "${pluginInterfaceExtension.name}" which is not installed`
          )
        }

        const entityExtensions = Object.entries(pluginInterfaceExtension.entities ?? {}) as [
          entityAlias: string,
          {
            name: string
          },
        ][]

        for (const [entityAlias, { name: interfaceEntityName }] of entityExtensions) {
          const entitySchema = backingIntegration.definition.entities?.[interfaceEntityName]?.schema

          if (!entitySchema) {
            // This should never happen
            throw new Error(
              `Interface entity "${interfaceEntityName}" does not exist in integration "${backingIntegration.name}"`
            )
          }

          zuiReferenceMap[`interface:${interfaceAlias}/entities/${entityAlias}`] = entitySchema
        }
      }
    }

    return zuiReferenceMap
  }

  private _dereferenceZuiSchema(
    schema: ZuiObjectOrRefSchema,
    zuiReferenceMap: Record<string, z.ZodTypeAny>
  ): ZuiObjectSchema {
    return schema.dereference(zuiReferenceMap) as ZuiObjectSchema
  }

  private _dereferenceDefinitionSchemas<TDefinitionRecord extends Record<string, { schema: ZuiObjectOrRefSchema }>>(
    definitions: TDefinitionRecord | undefined,
    zuiReferenceMap: Record<string, z.ZodTypeAny>
  ): TDefinitionRecord {
    return Object.fromEntries(
      Object.entries(definitions ?? {}).map(([key, definition]) => [
        key,
        this._dereferenceDefinitionSchema(definition, zuiReferenceMap),
      ])
    ) as TDefinitionRecord
  }

  private _dereferenceDefinitionSchema<TDefinition extends { schema: ZuiObjectOrRefSchema } | undefined>(
    definition: TDefinition,
    zuiReferenceMap: Record<string, z.ZodTypeAny>
  ): TDefinition {
    return definition
      ? { ...definition, schema: this._dereferenceZuiSchema(definition.schema, zuiReferenceMap) }
      : definition
  }

  private _dereferenceActionDefinitionSchemas<
    TDefinitionRecord extends Record<
      string,
      { input: { schema: ZuiObjectOrRefSchema }; output: { schema: ZuiObjectOrRefSchema } }
    >,
  >(definitions: TDefinitionRecord | undefined, zuiReferenceMap: Record<string, z.ZodTypeAny>): TDefinitionRecord {
    return Object.fromEntries(
      Object.entries(definitions ?? {}).map(([key, definition]) => [
        key,
        {
          ...definition,
          input: { schema: this._dereferenceZuiSchema(definition.input.schema, zuiReferenceMap) },
          output: { schema: this._dereferenceZuiSchema(definition.output.schema, zuiReferenceMap) },
        },
      ])
    ) as TDefinitionRecord
  }
}
