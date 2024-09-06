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

  templateName?: (name: string, props: InterfaceTemplateNameProps<TEntities>) => string
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
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents
> = {
  resolved: ResolvedInterface<TActions, TEvents>
  implementStatement: InterfaceImplementationStatement
}

export class InterfaceDeclaration<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']
  public readonly entities: NonNullable<this['props']['entities']>
  public readonly events: NonNullable<this['props']['events']>
  public readonly actions: NonNullable<this['props']['actions']>
  public readonly channels: NonNullable<this['props']['channels']>
  public readonly templateName: this['props']['templateName']

  public constructor(public readonly props: InterfaceDeclarationProps<TEntities, TActions, TEvents>) {
    this.name = props.name
    this.version = props.version
    this.entities = props.entities ?? ({} as NonNullable<this['props']['entities']>)
    this.events = props.events ?? ({} as NonNullable<this['props']['events']>)
    this.actions = props.actions ?? ({} as NonNullable<this['props']['actions']>)
    this.channels = props.channels ?? ({} as NonNullable<this['props']['channels']>)

    this.templateName = props.templateName
  }

  public resolve(props: InterfaceResolveInput<TEntities>): InterfaceResolveOutput<TActions, TEvents> {
    const { entities } = props

    const implementStatement: InterfaceImplementationStatement = {
      name: this.name,
      version: this.version,
      entities: utils.mapValues(entities, (entity) => ({ name: entity.name })), // { item: { name: 'issue' } }
      actions: {},
      events: {},
    }

    const actions: Record<string, ActionDefinition> = {}
    const events: Record<string, EventDefinition> = {}
    const channels: Record<string, ChannelDefinition> = {}

    // dereference actions
    for (const [actionName, action] of utils.pairs(this.actions)) {
      const resolvedInputSchema = this._dereference(action.input.schema, entities)
      const resolvedOutputSchema = this._dereference(action.output.schema, entities)

      const newActionName = this._rename(entities, actionName)
      actions[newActionName] = {
        input: { schema: resolvedInputSchema },
        output: { schema: resolvedOutputSchema },
      }
      implementStatement.actions[actionName] = { name: newActionName }
    }

    // dereference events
    for (const [eventName, event] of utils.pairs(this.events)) {
      const resolvedEventSchema = this._dereference(event.schema, entities)
      const newEventName = this._rename(entities, eventName)
      events[newEventName] = { schema: resolvedEventSchema }
      implementStatement.events[eventName] = { name: newEventName }
    }

    // dereference channels
    for (const [channelName, channel] of utils.pairs(this.channels)) {
      const messages: Record<string, { schema: AnyZodObject }> = {}
      for (const [messageName, message] of utils.pairs(channel.messages)) {
        const resolvedMessageSchema = this._dereference(message.schema, entities)
        messages[messageName] = { schema: resolvedMessageSchema }
      }
      channels[channelName] = { messages }
    }

    const resolved = {
      actions: actions as ResolvedInterface<TActions, TEvents>['actions'],
      events: events as ResolvedInterface<TActions, TEvents>['events'],
      channels: channels as ResolvedInterface<TActions, TEvents>['channels'],
    }

    return {
      resolved,
      implementStatement,
    }
  }

  private _dereference(
    generic: GenericZuiSchema<EntityReferences<TEntities>, AnyZodObject>,
    entities: InterfaceResolveInput<TEntities>['entities']
  ): AnyZodObject {
    const entitySchemas: Record<string, AnyZodObject> = {}
    const entityReferences: Record<string, ZodRef> = {}
    for (const [entityName, entity] of utils.pairs(entities)) {
      entitySchemas[entityName] = entity.schema
      entityReferences[entityName] = z.ref(entityName)
    }
    return generic(entityReferences as EntityReferences<TEntities>).dereference(
      entitySchemas as TEntities
    ) as AnyZodObject
  }

  private _rename(entities: InterfaceResolveInput<TEntities>['entities'], name: string): string {
    if (!this.templateName) {
      return name
    }

    const templateProps = utils.mapValues(entities, (entity) => entity.name) as Record<keyof TEntities, string>
    return this.templateName(name, templateProps)
  }
}
