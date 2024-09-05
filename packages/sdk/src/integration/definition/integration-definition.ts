import { Writable } from '../../type-utils'
import * as utils from '../../utils'
import { z } from '../../zui'
import { SchemaStore, BrandedSchema, createStore, isBranded, getName } from './branded-schema'
import { BaseConfig, BaseEvents, BaseActions, BaseChannels, BaseStates, BaseEntities, BaseConfigs } from './generic'
import { InterfaceDeclaration, InterfaceResolveInput } from './interface-declaration'
import {
  ConfigurationDefinition,
  EventDefinition,
  ChannelDefinition,
  ActionDefinition,
  StateDefinition,
  UserDefinition,
  SecretDefinition,
  EntityDefinition,
  MessageDefinition,
  InterfaceImplementationStatement,
  AdditionalConfigurationDefinition,
} from './types'

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
  TConfigs extends BaseConfigs = BaseConfigs,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities
> = {
  name: string
  version: string

  title?: string
  description?: string
  icon?: string
  readme?: string

  identifier?: {
    extractScript?: string
    fallbackHandlerScript?: string
  }

  configuration?: ConfigurationDefinition<TConfig>
  configurations?: {
    [K in keyof TConfigs]: AdditionalConfigurationDefinition<TConfigs[K]>
  }

  events?: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }

  actions?: {
    [K in keyof TActions]: ActionDefinition<TActions[K]>
  }

  channels?: {
    [K in keyof TChannels]: ChannelDefinition<TChannels[K]>
  }

  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }

  user?: UserDefinition

  secrets?: Record<string, SecretDefinition>

  entities?: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }
}

type InterfaceTypeArguments<TInterfaceEntities extends BaseEntities> = {
  [K in keyof TInterfaceEntities]: BrandedSchema<z.ZodSchema<z.infer<TInterfaceEntities[K]>>>
}

type ExtensionBuilder<TIntegrationEntities extends BaseEntities, TInterfaceEntities extends BaseEntities> = (
  input: SchemaStore<TIntegrationEntities>
) => InterfaceTypeArguments<TInterfaceEntities>

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TConfigs extends BaseConfigs = BaseConfigs,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']
  public readonly title: this['props']['title']
  public readonly description: this['props']['description']
  public readonly icon: this['props']['icon']
  public readonly readme: this['props']['readme']
  public readonly configuration: this['props']['configuration']
  public readonly configurations: this['props']['configurations']
  public readonly events: this['props']['events']
  public readonly actions: this['props']['actions']
  public readonly channels: this['props']['channels']
  public readonly states: this['props']['states']
  public readonly user: this['props']['user']
  public readonly secrets: this['props']['secrets']
  public readonly identifier: this['props']['identifier']
  public readonly entities: this['props']['entities']

  public readonly interfaces: Record<string, InterfaceImplementationStatement> = {}

  public constructor(
    public readonly props: IntegrationDefinitionProps<
      TConfig,
      TConfigs,
      TEvents,
      TActions,
      TChannels,
      TStates,
      TEntities
    >
  ) {
    this.name = props.name
    this.version = props.version
    this.icon = props.icon
    this.readme = props.readme
    this.title = props.title
    this.identifier = props.identifier
    this.description = props.description
    this.configuration = props.configuration
    this.configurations = props.configurations
    this.events = props.events
    this.actions = props.actions
    this.channels = props.channels
    this.states = props.states
    this.user = props.user
    this.secrets = props.secrets
    this.entities = props.entities
  }

  public clone(
    props: Partial<IntegrationDefinitionProps<TConfig, TConfigs, TEvents, TActions, TChannels, TStates, TEntities>>
  ): IntegrationDefinition<TConfig, TConfigs, TEvents, TActions, TChannels, TStates, TEntities> {
    const clone = new IntegrationDefinition<TConfig, TConfigs, TEvents, TActions, TChannels, TStates, TEntities>({
      ...this,
      ...props,
    })
    for (const [key, value] of Object.entries(this.interfaces)) {
      clone.interfaces[key] = value
    }
    return clone
  }

  public extend<E extends BaseEntities>(
    interfaceDeclaration: InterfaceDeclaration<E>,
    builder: ExtensionBuilder<TEntities, E>
  ): this {
    const extensionBuilderOutput = builder(createStore(this.entities))
    const unbrandedEntity = utils.pairs(extensionBuilderOutput).find(([_k, e]) => !isBranded(e))
    if (unbrandedEntity) {
      // this means the user tried providing a plain schema without referencing an entity from the integration
      throw new Error(
        `Cannot extend interface "${interfaceDeclaration.name}" with entity "${unbrandedEntity[0]}"; the provided schema is not part of the integration's entities.`
      )
    }

    const interfaceTypeArguments = utils.mapValues(extensionBuilderOutput, (e) => ({
      name: getName(e),
      schema: e.schema,
    }))

    const { resolved, implementStatement } = interfaceDeclaration.resolve({
      entities: interfaceTypeArguments as InterfaceResolveInput<E>['entities'],
    })

    const self = this as Writable<IntegrationDefinition>

    /**
     * If an action is defined both in the integration and the interface; we merge both.
     * This allows setting more specific properties in the integration, while staying compatible with the interface.
     * Same goes for channels and events.
     */

    self.actions = utils.mergeRecords(self.actions ?? {}, resolved.actions, this._mergeActions)
    self.channels = utils.mergeRecords(self.channels ?? {}, resolved.channels, this._mergeChannels)
    self.events = utils.mergeRecords(self.events ?? {}, resolved.events, this._mergeEvents)

    const entityNames = Object.values(interfaceTypeArguments).map((e) => e.name)

    const key =
      entityNames.length === 0 ? interfaceDeclaration.name : `${interfaceDeclaration.name}<${entityNames.join(',')}>`
    this.interfaces[key] = implementStatement

    return this
  }

  private _mergeActions = (a: ActionDefinition, b: ActionDefinition): ActionDefinition => {
    return {
      title: b.title ?? a.title,
      description: b.description ?? a.description,
      input: {
        schema: a.input.schema.merge(b.input.schema),
      },
      output: {
        schema: a.output.schema.merge(b.output.schema),
      },
    }
  }

  private _mergeEvents = (a: EventDefinition, b: EventDefinition): EventDefinition => {
    return {
      title: b.title ?? a.title,
      description: b.description ?? a.description,
      schema: a.schema.merge(b.schema),
    }
  }

  private _mergeChannels = (a: ChannelDefinition, b: ChannelDefinition): ChannelDefinition => {
    const messages = utils.mergeRecords(a.messages, b.messages, this._mergeMessage)
    return {
      title: b.title ?? a.title,
      description: b.description ?? a.description,
      conversation: b.conversation ?? a.conversation,
      message: b.message ?? a.message,
      messages,
    }
  }

  private _mergeMessage = (a: MessageDefinition, b: MessageDefinition): MessageDefinition => {
    return {
      schema: a.schema.merge(b.schema),
    }
  }
}
