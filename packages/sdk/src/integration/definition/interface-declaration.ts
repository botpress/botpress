import * as templating from '../../templating'
import * as utils from '../../utils'
import z, { AnyZodObject, GenericZuiSchema, ZodRef } from '../../zui'
import { BaseActions, BaseChannels, BaseEntities, BaseEvents } from './generic'
import {
  ActionDefinition,
  ChannelDefinition,
  EntityDefinition,
  EventDefinition,
  InterfaceImplementationStatement,
  ResolvedInterface,
} from './types'

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

export type InterfaceTemplateNameProps<TEntities extends BaseEntities = BaseEntities> = {
  [K in keyof TEntities]: string
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

export type InterfaceResolveInput<TEntities extends BaseEntities = BaseEntities> = {
  entities: {
    [K in keyof TEntities]: {
      name: string
      schema: TEntities[K]
    }
  }
}

export type InterfaceResolveOutput<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents,
  TChannels extends BaseChannels = BaseChannels
> = {
  resolved: ResolvedInterface<TActions, TEvents>
  implementStatement: InterfaceImplementationStatement<TEntities, TActions, TEvents, TChannels>
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

  // TODO: replace this function by a template string system
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
        : utils.mapValues(
            props.events,
            (event): EventDefinition => ({
              ...event,
              schema: event.schema(entityReferences),
            })
          )

    const actions: Record<string, ActionDefinition> =
      props.actions === undefined
        ? {}
        : utils.mapValues(
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
        : utils.mapValues(
            props.channels,
            (channel): ChannelDefinition => ({
              ...channel,
              messages: utils.mapValues(channel.messages, (message) => ({
                ...message,
                schema: message.schema(entityReferences),
              })),
            })
          )

    this.events = events as this['events']
    this.actions = actions as this['actions']
    this.channels = channels as this['channels']
  }

  public resolve(
    props: InterfaceResolveInput<TEntities>
  ): InterfaceResolveOutput<TEntities, TActions, TEvents, TChannels> {
    const { entities } = props

    const implementStatement: InterfaceImplementationStatement = {
      name: this.name,
      version: this.version,
      entities: utils.mapValues(entities, (entity) => ({ name: entity.name })), // { item: { name: 'issue' } }
      actions: {},
      events: {},
      channels: {},
    }

    const actions: Record<string, ActionDefinition> = {}
    const events: Record<string, EventDefinition> = {}
    const channels: Record<string, ChannelDefinition> = {}

    const entitySchemas: Record<string, AnyZodObject> = utils.mapValues(entities, (entity) => entity.schema)

    // dereference actions
    for (const [actionName, action] of utils.pairs(this.actions)) {
      const resolvedInputSchema = action.input.schema.dereference(entitySchemas) as AnyZodObject
      const resolvedOutputSchema = action.output.schema.dereference(entitySchemas) as AnyZodObject

      const newActionName = this._rename(entities, actionName)
      actions[newActionName] = {
        ...action,
        input: { schema: resolvedInputSchema },
        output: { schema: resolvedOutputSchema },
      }
      implementStatement.actions[actionName] = { name: newActionName }
    }

    // dereference events
    for (const [eventName, event] of utils.pairs(this.events)) {
      const resolvedEventSchema = event.schema.dereference(entitySchemas) as AnyZodObject
      const newEventName = this._rename(entities, eventName)
      events[newEventName] = { ...event, schema: resolvedEventSchema }
      implementStatement.events[eventName] = { name: newEventName }
    }

    // dereference channels
    for (const [channelName, channel] of utils.pairs(this.channels)) {
      const messages: Record<string, { schema: AnyZodObject }> = {}
      for (const [messageName, message] of utils.pairs(channel.messages)) {
        const resolvedMessageSchema = message.schema.dereference(entitySchemas) as AnyZodObject
        messages[messageName] = { ...message, schema: resolvedMessageSchema }
      }
      channels[channelName] = { ...channel, messages }
    }

    const resolved: ResolvedInterface<TActions, TEvents, TChannels> = {
      actions: actions as ResolvedInterface<TActions, TEvents, TChannels>['actions'],
      events: events as ResolvedInterface<TActions, TEvents, TChannels>['events'],
      channels: channels as ResolvedInterface<TActions, TEvents, TChannels>['channels'],
    }

    // TODO: ensure the resolved interface contains no-more references

    return {
      resolved,
      implementStatement: implementStatement as InterfaceImplementationStatement<
        TEntities,
        TActions,
        TEvents,
        TChannels
      >,
    }
  }

  private _getEntityReference = (entities: this['entities']): EntityReferences<TEntities> => {
    const entityReferences: Record<string, ZodRef> = {} as EntityReferences<TEntities>
    for (const entityName of Object.keys(entities)) {
      entityReferences[entityName] = z.ref(entityName)
    }
    return entityReferences as EntityReferences<TEntities>
  }

  private _rename(entities: InterfaceResolveInput<TEntities>['entities'], name: string): string {
    if (!this.templateName) {
      return name as string
    }
    const templateProps = utils.mapValues(entities, (entity) => entity.name) as Record<keyof TEntities, string>
    return templating.formatHandleBars(this.templateName, { ...templateProps, name })
  }
}
