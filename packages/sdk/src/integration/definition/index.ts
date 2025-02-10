import type * as esbuild from 'esbuild'
import { resolveInterface } from '../../interface/resolve'
import { InterfacePackage } from '../../package'
import * as utils from '../../utils'
import { mergeObjectSchemas, z } from '../../zui'
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
  MessageDefinition,
  InterfaceExtension,
} from './types'

export * from './types'

export type IntegrationDefinitionProps<
  TName extends string = string,
  TVersion extends string = string,
  TConfig extends BaseConfig = BaseConfig,
  TConfigs extends BaseConfigs = BaseConfigs,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities,
> = {
  name: TName
  version: TVersion

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

  interfaces?: Record<string, InterfaceExtension>

  __advanced?: {
    esbuild?: Partial<esbuild.BuildOptions>
  }
}

type EntitiesOfPackage<TPackage extends InterfacePackage> = {
  [K in keyof TPackage['definition']['entities']]: NonNullable<TPackage['definition']['entities']>[K]['schema']
}

type ActionsOfPackage<TPackage extends InterfacePackage> = {
  [K in keyof TPackage['definition']['actions']]: NonNullable<TPackage['definition']['actions']>[K]['input']['schema']
}

type EventsOfPackage<TPackage extends InterfacePackage> = {
  [K in keyof TPackage['definition']['events']]: NonNullable<TPackage['definition']['events']>[K]['schema']
}

type ChannelsOfPackage<TPackage extends InterfacePackage> = {
  [K in keyof TPackage['definition']['channels']]: {
    [M in keyof NonNullable<TPackage['definition']['channels']>[K]['messages']]: NonNullable<
      NonNullable<TPackage['definition']['channels']>[K]['messages']
    >[M]['schema']
  }
}

export type ActionOverrideProps = utils.types.AtLeastOneProperty<
  Pick<Required<ActionDefinition>, 'title' | 'description' | 'billable' | 'cacheable'> & {
    name: string
  }
>
export type EventOverrideProps = utils.types.AtLeastOneProperty<
  Pick<Required<EventDefinition>, 'title' | 'description'> & {
    name: string
  }
>
export type ChannelOverrideProps = utils.types.AtLeastOneProperty<
  Pick<Required<ChannelDefinition>, 'title' | 'description'> & {
    name: string
    message: {
      tags: Required<Required<ChannelDefinition>['message']>['tags']
    }
    conversation: {
      tags: Required<Required<ChannelDefinition>['conversation']>['tags']
    }
  }
>

type ActionOverrides<TInterfaceActionNames extends string = string> = utils.types.AtLeastOneProperty<
  Record<TInterfaceActionNames, ActionOverrideProps>
>
type EventOverrides<TInterfaceEventNames extends string = string> = utils.types.AtLeastOneProperty<
  Record<TInterfaceEventNames, EventOverrideProps>
>
type ChannelOverrides<TInterfaceChannelNames extends string = string> = utils.types.AtLeastOneProperty<
  Record<TInterfaceChannelNames, ChannelOverrideProps>
>

type ExtensionBuilderInput<
  TIntegrationEntities extends BaseEntities,
  _TIntegrationActions extends BaseActions,
  _TIntegrationEvents extends BaseEvents,
  _TIntegrationChannels extends BaseChannels,
> = {
  entities: SchemaStore<TIntegrationEntities>
}

type ExtensionBuilderOutput<
  TInterfaceEntities extends BaseEntities,
  TInterfaceActions extends BaseActions,
  TInterfaceEvents extends BaseEvents,
  TInterfaceChannels extends BaseChannels,
> = {
  entities: {
    [K in keyof TInterfaceEntities]: BrandedSchema<z.ZodSchema<z.infer<TInterfaceEntities[K]>>>
  }
  actions?: ActionOverrides<Extract<keyof TInterfaceActions, string>>
  events?: EventOverrides<Extract<keyof TInterfaceEvents, string>>
  channels?: ChannelOverrides<Extract<keyof TInterfaceChannels, string>>
}

type ExtensionBuilder<
  TIntegrationEntities extends BaseEntities,
  TIntegrationActions extends BaseActions,
  TIntegrationEvents extends BaseEvents,
  TIntegrationChannels extends BaseChannels,
  TInterfaceEntities extends BaseEntities,
  TInterfaceActions extends BaseActions,
  TInterfaceEvents extends BaseEvents,
  TInterfaceChannels extends BaseChannels,
> = (
  input: ExtensionBuilderInput<TIntegrationEntities, TIntegrationActions, TIntegrationEvents, TIntegrationChannels>
) => ExtensionBuilderOutput<TInterfaceEntities, TInterfaceActions, TInterfaceEvents, TInterfaceChannels>

type TypeArgument = { name: string; schema: z.AnyZodObject }

export class IntegrationDefinition<
  TName extends string = string,
  TVersion extends string = string,
  TConfig extends BaseConfig = BaseConfig,
  TConfigs extends BaseConfigs = BaseConfigs,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities,
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
  public readonly __advanced: this['props']['__advanced']
  public constructor(
    public readonly props: IntegrationDefinitionProps<
      TName,
      TVersion,
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
    this.__advanced = props.__advanced
  }

  public extend<P extends InterfacePackage>(
    interfacePkg: P,
    builder: ExtensionBuilder<
      TEntities,
      TActions,
      TEvents,
      TChannels,
      EntitiesOfPackage<P>,
      ActionsOfPackage<P>,
      EventsOfPackage<P>,
      ChannelsOfPackage<P>
    >
  ): this {
    const { entities, actions, events, channels } = this._callBuilder(interfacePkg, builder)

    const self = this as utils.types.Writable<IntegrationDefinition>
    self.interfaces ??= {}

    const entityNames = Object.values(entities).map((e) => e.name)

    const key = entityNames.length === 0 ? interfacePkg.name : `${interfacePkg.name}<${entityNames.join(',')}>`

    const { resolved, statement } = resolveInterface({
      ...interfacePkg,
      entities,
      actions: utils.records.stripUndefinedProps(actions),
      events: utils.records.stripUndefinedProps(events),
      channels: utils.records.stripUndefinedProps(channels),
    })

    /**
     * If an action is defined both in the integration and the interface; we merge both.
     * This allows setting more specific properties in the integration, while staying compatible with the interface.
     * Same goes for channels and events.
     */
    self.actions = utils.records.mergeRecords(self.actions ?? {}, resolved.actions, this._mergeActions)
    self.channels = utils.records.mergeRecords(self.channels ?? {}, resolved.channels, this._mergeChannels)
    self.events = utils.records.mergeRecords(self.events ?? {}, resolved.events, this._mergeEvents)

    self.interfaces[key] = {
      id: interfacePkg.id,
      ...statement,
    }

    return this
  }

  private _callBuilder<P extends InterfacePackage>(
    interfacePkg: P,
    builder: ExtensionBuilder<
      TEntities,
      TActions,
      TEvents,
      TChannels,
      EntitiesOfPackage<P>,
      ActionsOfPackage<P>,
      EventsOfPackage<P>,
      ChannelsOfPackage<P>
    >
  ): {
    entities: Record<string, TypeArgument>
    actions: ActionOverrides
    events: EventOverrides
    channels: ChannelOverrides
  } {
    const entityStore = createStore(this.entities)
    const extensionBuilderInput: ExtensionBuilderInput<TEntities, TActions, TEvents, TChannels> = {
      entities: entityStore,
    }
    const extensionBuilderOutput = builder(extensionBuilderInput)
    const unbrandedEntity = utils.records.pairs(extensionBuilderOutput.entities).find(([_k, e]) => !isBranded(e))
    if (unbrandedEntity) {
      // this means the user tried providing a plain schema without referencing an entity from the integration
      throw new Error(
        `Cannot extend interface "${interfacePkg.name}" with entity "${unbrandedEntity[0]}"; the provided schema is not part of the integration's entities.`
      )
    }
    const entities = utils.records.mapValues(extensionBuilderOutput.entities, (e) => ({
      name: getName(e),
      schema: e.schema as z.AnyZodObject,
    }))
    return {
      entities,
      actions: extensionBuilderOutput.actions ?? {},
      events: extensionBuilderOutput.events ?? {},
      channels: extensionBuilderOutput.channels ?? {},
    }
  }

  private _mergeActions = (a: ActionDefinition, b: ActionDefinition): ActionDefinition => {
    return {
      ...a,
      ...b,
      input: {
        schema: mergeObjectSchemas(a.input.schema, b.input.schema),
      },
      output: {
        schema: mergeObjectSchemas(a.input.schema, b.output.schema),
      },
    }
  }

  private _mergeEvents = (a: EventDefinition, b: EventDefinition): EventDefinition => {
    return {
      ...a,
      ...b,
      schema: mergeObjectSchemas(a.schema, b.schema),
    }
  }

  private _mergeChannels = (a: ChannelDefinition, b: ChannelDefinition): ChannelDefinition => {
    const messages = utils.records.mergeRecords(a.messages, b.messages, this._mergeMessage)
    return {
      ...a,
      ...b,
      messages,
    }
  }

  private _mergeMessage = (a: MessageDefinition, b: MessageDefinition): MessageDefinition => {
    return {
      schema: mergeObjectSchemas(a.schema, b.schema),
    }
  }
}
