import { ActionDefinition, ChannelDefinition, EntityDefinition, EventDefinition } from '../integration/definition'
import * as utils from '../utils'
import z, { AnyZodObject, GenericZuiSchema, ZodRef } from '../zui'

type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, AnyZodObject>
type BaseMessages = Record<string, AnyZodObject>
type BaseChannels = Record<string, BaseMessages>
type BaseEntities = Record<string, AnyZodObject>

type EntityReferences<TEntities extends BaseEntities> = {
  [K in keyof TEntities]: ZodRef
}

type GenericEventDefinition<TEntities extends BaseEntities, TEvent extends BaseEvents[string] = BaseEvents[string]> = {
  schema: GenericZuiSchema<EntityReferences<TEntities>, TEvent>
}

type GenericChannelDefinition<
  TEntities extends BaseEntities,
  TChannel extends BaseChannels[string] = BaseChannels[string]
> = {
  messages: {
    [K in keyof TChannel]: {
      schema: GenericZuiSchema<EntityReferences<TEntities>, TChannel[K]>
    }
  }
}

type GenericActionDefinition<
  TEntities extends BaseEntities,
  TAction extends BaseActions[string] = BaseActions[string]
> = {
  billable?: boolean
  cacheable?: boolean
  input: { schema: GenericZuiSchema<EntityReferences<TEntities>, TAction> }
  output: { schema: GenericZuiSchema<EntityReferences<TEntities>, AnyZodObject> }
}

export type InterfaceDeclarationProps<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEntities = BaseEntities,
  TChannels extends BaseChannels = BaseChannels
> = {
  name: string
  version: string

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

  templateName?: string
}

export class InterfaceDeclaration<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents,
  TChannels extends BaseChannels = BaseChannels
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']

  public readonly entities: { [K in keyof TEntities]: EntityDefinition<TEntities[K]> }
  public readonly events: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }
  public readonly actions: { [K in keyof TActions]: ActionDefinition<TActions[K]> }
  public readonly channels: { [K in keyof TChannels]: ChannelDefinition<TChannels[K]> }

  public readonly templateName: this['props']['templateName']

  public constructor(public readonly props: InterfaceDeclarationProps<TEntities, TActions, TEvents, TChannels>) {
    this.name = props.name
    this.version = props.version
    this.entities = props.entities ?? ({} as this['entities'])
    this.templateName = props.templateName

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

  private _getEntityReference = (entities: this['entities']): EntityReferences<TEntities> => {
    const entityReferences: Record<string, ZodRef> = {} as EntityReferences<TEntities>
    for (const entityName of Object.keys(entities)) {
      entityReferences[entityName] = z.ref(entityName)
    }
    return entityReferences as EntityReferences<TEntities>
  }
}
