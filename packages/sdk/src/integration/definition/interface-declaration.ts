import * as utils from '../../utils'
import z, { AnyZodObject, GenericZuiSchema, ZodRef } from '../../zui'
import { BaseActions, BaseEntities, BaseEvents } from './generic'
import { ActionDefinition, EntityDefinition, EventDefinition, InterfaceInstance } from './types'

type EntityReferences<TEntities extends BaseEntities> = {
  [K in keyof TEntities]: ZodRef
}

type GenericEventDefinition<TEntities extends BaseEntities, TEvent extends BaseEvents[string] = BaseEvents[string]> = {
  schema: GenericZuiSchema<EntityReferences<TEntities>, TEvent>
}

type GenericActionDefinition<
  TEntities extends BaseEntities,
  TAction extends BaseActions[string] = BaseActions[string]
> = {
  input: { schema: GenericZuiSchema<EntityReferences<TEntities>, TAction> }
  output: { schema: GenericZuiSchema<EntityReferences<TEntities>, AnyZodObject> }
}

export type InterfaceTemplateNameProps<TEntities extends BaseEntities = BaseEntities> = {
  [K in keyof TEntities]: string
}

export type InterfaceDeclarationProps<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEntities = BaseEntities
> = {
  name: string

  events: { [K in keyof TEvents]: GenericEventDefinition<TEntities, TEvents[K]> }

  actions: {
    [K in keyof TActions]: GenericActionDefinition<TEntities, TActions[K]>
  }

  entities: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }

  templateName?: (name: string, props: InterfaceTemplateNameProps<TEntities>) => string
}

export type InterfaceResolveProps<TEntities extends BaseEntities = BaseEntities> = {
  entities: {
    [K in keyof TEntities]: {
      name: string
      schema: TEntities[K]
    }
  }
}

export class InterfaceDeclaration<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEntities = BaseEntities
> {
  public readonly entities: this['props']['entities']
  public readonly name: this['props']['name']
  public readonly events: this['props']['events']
  public readonly actions: this['props']['actions']
  public readonly templateName: this['props']['templateName']

  public constructor(public readonly props: InterfaceDeclarationProps<TEntities, TActions, TEvents>) {
    this.name = props.name
    this.events = props.events
    this.actions = props.actions
    this.entities = props.entities
    this.templateName = props.templateName
  }

  public resolve(props: InterfaceResolveProps<TEntities>): InterfaceInstance<TActions, TEvents> {
    const { entities } = props

    const actions: Record<string, ActionDefinition> = {}
    const events: Record<string, EventDefinition> = {}

    // dereference actions
    for (const [actionName, action] of utils.pairs(this.actions)) {
      const resolvedInputSchema = this._dereference(action.input.schema, entities)
      const resolvedOutputSchema = this._dereference(action.output.schema, entities)

      const newActionName = this._rename(entities, actionName)
      actions[newActionName] = {
        input: { schema: resolvedInputSchema },
        output: { schema: resolvedOutputSchema },
      }
    }

    // dereference events
    for (const [eventName, event] of utils.pairs(this.events)) {
      const resolvedEventSchema = this._dereference(event.schema, entities)
      const newEventName = this._rename(entities, eventName)
      events[newEventName] = { schema: resolvedEventSchema }
    }

    return {
      actions,
      events,
    } as InterfaceInstance<TActions, TEvents>
  }

  private _dereference(
    generic: GenericZuiSchema<EntityReferences<TEntities>, AnyZodObject>,
    entities: InterfaceResolveProps<TEntities>['entities']
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

  private _rename(entities: InterfaceResolveProps<TEntities>['entities'], name: string): string {
    if (!this.templateName) {
      return name
    }

    const templateProps = utils.mapValues(entities, (entity) => entity.name) as Record<keyof TEntities, string>
    return this.templateName(name, templateProps)
  }
}
