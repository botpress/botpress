import { BaseConfig, BaseEvents, BaseActions, BaseChannels, BaseStates, BaseEntities } from './generic'
import { InterfaceDeclaration, InterfaceResolveProps } from './interface'
import {
  ConfigurationDefinition,
  EventDefinition,
  ChannelDefinition,
  ActionDefinition,
  StateDefinition,
  UserDefinition,
  SecretDefinition,
  EntityDefinition,
  InterfaceInstance,
} from './types'

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
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

export type ExtensionBuilderProps<TEntities extends BaseEntities = BaseEntities> = {
  entities: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }
}

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
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
  public readonly events: this['props']['events']
  public readonly actions: this['props']['actions']
  public readonly channels: this['props']['channels']
  public readonly states: this['props']['states']
  public readonly user: this['props']['user']
  public readonly secrets: this['props']['secrets']
  public readonly identifier: this['props']['identifier']
  public readonly entities: this['props']['entities']
  public readonly interfaces: InterfaceInstance[] = []

  public clone(
    props: Partial<IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates, TEntities>>
  ): IntegrationDefinition<TConfig, TEvents, TActions, TChannels, TStates, TEntities> {
    const clone = new IntegrationDefinition<TConfig, TEvents, TActions, TChannels, TStates, TEntities>({
      ...this,
      ...props,
    })
    clone.interfaces.push(...this.interfaces)
    return clone
  }

  public constructor(
    public readonly props: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates, TEntities>
  ) {
    this.name = props.name
    this.version = props.version
    this.icon = props.icon
    this.readme = props.readme
    this.title = props.title
    this.identifier = props.identifier
    this.description = props.description
    this.configuration = props.configuration
    this.events = props.events
    this.actions = props.actions
    this.channels = props.channels
    this.states = props.states
    this.user = props.user
    this.secrets = props.secrets
    this.entities = props.entities
  }

  public extend<E extends BaseEntities>(
    interfaceDeclaration: InterfaceDeclaration<E>,
    builder: (self: ExtensionBuilderProps<TEntities>) => InterfaceResolveProps<E>
  ): this {
    const resolveProps = builder({ entities: this.entities ?? {} } as ExtensionBuilderProps<TEntities>)
    const interfaceInstance = interfaceDeclaration.resolve(resolveProps)
    this.interfaces.push(interfaceInstance)
    return this
  }
}
