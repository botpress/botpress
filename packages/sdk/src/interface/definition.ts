import { ActionDefinition, ChannelDefinition, EntityDefinition, EventDefinition } from '../integration/definition'
import * as utils from '../utils'
import z, { ZuiObjectSchema, GenericZuiSchema, ZodRef } from '../zui'

type BaseEvents = Record<string, ZuiObjectSchema>
type BaseActions = Record<string, ZuiObjectSchema>
type BaseMessages = Record<string, ZuiObjectSchema>
type BaseChannels = Record<string, BaseMessages>
type BaseEntities = Record<string, ZuiObjectSchema>

type EntityReferences<TEntities extends BaseEntities> = {
  [K in keyof TEntities]: ZodRef
}

type GenericEventDefinition<TEntities extends BaseEntities, TEvent extends BaseEvents[string] = BaseEvents[string]> = {
  schema: GenericZuiSchema<EntityReferences<TEntities>, TEvent>
}

type GenericChannelDefinition<
  TEntities extends BaseEntities,
  TChannel extends BaseChannels[string] = BaseChannels[string],
> = {
  messages: {
    [K in keyof TChannel]: {
      schema: GenericZuiSchema<EntityReferences<TEntities>, TChannel[K]>
    }
  }
}

type GenericActionDefinition<
  TEntities extends BaseEntities,
  TAction extends BaseActions[string] = BaseActions[string],
> = {
  title?: string
  description?: string
  billable?: boolean
  cacheable?: boolean
  input: { schema: GenericZuiSchema<EntityReferences<TEntities>, TAction> }
  output: { schema: GenericZuiSchema<EntityReferences<TEntities>, ZuiObjectSchema> }
}

export type InterfaceDefinitionProps<
  TName extends string = string,
  TVersion extends string = string,
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEntities = BaseEntities,
  TChannels extends BaseChannels = BaseChannels,
> = {
  name: TName
  version: TVersion

  entities?: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }

  events?: { [K in keyof TEvents]: GenericEventDefinition<TEntities, TEvents[K]> }

  actions?: {
    [K in keyof TActions]: GenericActionDefinition<TEntities, TActions[K]>
  }

  channels?: {
    [K in keyof TChannels]: GenericChannelDefinition<TEntities, TChannels[K]>
  }
}

export class InterfaceDefinition<
  TName extends string = string,
  TVersion extends string = string,
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents,
  TChannels extends BaseChannels = BaseChannels,
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']

  public readonly entities: { [K in keyof TEntities]: EntityDefinition<TEntities[K]> }
  public readonly events: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }
  public readonly actions: { [K in keyof TActions]: ActionDefinition<TActions[K]> }
  public readonly channels: { [K in keyof TChannels]: ChannelDefinition<TChannels[K]> }

  public constructor(
    public readonly props: InterfaceDefinitionProps<TName, TVersion, TEntities, TActions, TEvents, TChannels>
  ) {
    this.name = props.name
    this.version = props.version
    this.entities = props.entities ?? ({} as this['entities'])

    const entityReferences = this._getEntityReference(this.entities)

    const events: Record<string, EventDefinition> =
      props.events === undefined
        ? {}
        : utils.records.mapValues(
            props.events,
            (event): EventDefinition => ({
              ...event,
              schema: event.schema(entityReferences),
            })
          )

    const actions: Record<string, ActionDefinition> =
      props.actions === undefined
        ? {}
        : utils.records.mapValues(
            props.actions,
            (action): ActionDefinition => ({
              ...action,
              input: {
                ...action.input,
                schema: action.input.schema(entityReferences),
              },
              output: {
                ...action.output,
                schema: action.output.schema(entityReferences),
              },
            })
          )

    const channels: Record<string, ChannelDefinition> =
      props.channels === undefined
        ? {}
        : utils.records.mapValues(
            props.channels,
            (channel): ChannelDefinition => ({
              ...channel,
              messages: utils.records.mapValues(channel.messages, (message) => ({
                ...message,
                schema: message.schema(entityReferences),
              })),
            })
          )

    this.events = events as this['events']
    this.actions = actions as this['actions']
    this.channels = channels as this['channels']
  }

  private _getEntityReference = (entities: Record<string, EntityDefinition>): EntityReferences<TEntities> => {
    const entityReferences: Record<string, ZodRef> = {} as EntityReferences<TEntities>
    for (const [entityName, entityDef] of Object.entries(entities)) {
      const title = entityDef.schema._def['x-zui']?.title
      const description = entityDef.schema._def.description

      const refSchema = z.ref(entityName)
      if (title) {
        refSchema.title(title)
      }
      if (description) {
        refSchema.describe(description)
      }

      entityReferences[entityName] = refSchema
    }
    return entityReferences as EntityReferences<TEntities>
  }
}
