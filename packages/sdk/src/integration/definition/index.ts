import { InterfacePackage } from '../../package'
import * as utils from '../../utils'
import { z } from '../../zui'
import { SchemaStore, BrandedSchema, createStore, isBranded, getName } from './branded-schema'
import { BaseConfig, BaseEvents, BaseActions, BaseChannels, BaseStates, BaseEntities, BaseConfigs } from './generic'
import {
  ConfigurationDefinition,
  EventDefinition,
  ChannelDefinition,
  ActionDefinition,
  StateDefinition,
  UserDefinition,
  SecretDefinition,
  EntityDefinition,
  AdditionalConfigurationDefinition,
} from './types'

export * from './types'

export type InterfaceExtensionInstance = InterfacePackage & {
  entities: Record<
    string,
    {
      name: string
      schema: z.AnyZodObject
    }
  >
}

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

  interfaces?: Record<string, InterfaceExtensionInstance>
}

type EntitiesOfPackage<TPackage extends InterfacePackage> = {
  [K in keyof TPackage['definition']['entities']]: NonNullable<TPackage['definition']['entities']>[K]['schema']
}

type ExtensionBuilderInput<TIntegrationEntities extends BaseEntities> = SchemaStore<TIntegrationEntities>

type ExtensionBuilderOutput<TInterfaceEntities extends BaseEntities> = {
  [K in keyof TInterfaceEntities]: BrandedSchema<z.ZodSchema<z.infer<TInterfaceEntities[K]>>>
}

type ExtensionBuilder<TIntegrationEntities extends BaseEntities, TInterfaceEntities extends BaseEntities> = (
  input: ExtensionBuilderInput<TIntegrationEntities>
) => ExtensionBuilderOutput<TInterfaceEntities>

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
  public readonly interfaces: this['props']['interfaces']
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
    this.interfaces = props.interfaces
  }

  public extend<P extends InterfacePackage>(
    interfacePkg: P,
    builder: ExtensionBuilder<TEntities, EntitiesOfPackage<P>>
  ): this {
    const extensionBuilderOutput = builder(createStore(this.entities))
    const unbrandedEntity = utils.records.pairs(extensionBuilderOutput).find(([_k, e]) => !isBranded(e))
    if (unbrandedEntity) {
      // this means the user tried providing a plain schema without referencing an entity from the integration
      throw new Error(
        `Cannot extend interface "${interfacePkg.definition.name}" with entity "${unbrandedEntity[0]}"; the provided schema is not part of the integration's entities.`
      )
    }

    const self = this as utils.types.Writable<IntegrationDefinition>
    self.interfaces ??= {}

    const interfaceTypeArguments = utils.records.mapValues(extensionBuilderOutput, (e) => ({
      name: getName(e),
      schema: e.schema as z.AnyZodObject,
    }))

    const entityNames = Object.values(interfaceTypeArguments).map((e) => e.name)

    const key =
      entityNames.length === 0
        ? interfacePkg.definition.name
        : `${interfacePkg.definition.name}<${entityNames.join(',')}>`

    self.interfaces[key] = {
      ...interfacePkg,
      entities: interfaceTypeArguments,
    }

    return this
  }
}
