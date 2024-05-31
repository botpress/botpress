import * as utils from '../../utils'
import { GenericZuiSchema } from '../../zui'
import { BaseActions, BaseEntities, BaseEvents } from './generic'
import { ActionDefinition, EntityDefinition, EventDefinition, InterfaceInstance } from './types'

type GenericEventDefinition<TEntities extends BaseEntities, TEvent extends BaseEvents[string] = BaseEvents[string]> = {
  schema: GenericZuiSchema<TEntities, TEvent>
}

type GenericActionDefinition<
  TEntities extends BaseEntities,
  TAction extends BaseActions[string] = BaseActions[string]
> = {
  input: { schema: GenericZuiSchema<TEntities, TAction> }
  output: { schema: GenericZuiSchema<TEntities> }
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
}

export type InterfaceResolveProps<TEntities extends BaseEntities = BaseEntities> = {
  entities: {
    [K in keyof TEntities]: {
      schema: TEntities[K]
    }
  }
  prefix: string
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

  public constructor(public readonly props: InterfaceDeclarationProps<TEntities, TActions, TEvents>) {
    this.name = props.name
    this.events = props.events
    this.actions = props.actions
    this.entities = props.entities
  }

  public resolve(props: InterfaceResolveProps<TEntities>): InterfaceInstance<TActions, TEvents> {
    const { entities, prefix } = props

    const entitySchemas = utils.mapValues(entities, (entity) => entity.schema) as unknown as TEntities

    const actions: Record<string, ActionDefinition> = {}
    const events: Record<string, EventDefinition> = {}

    // unreference actions
    for (const [actionName, action] of utils.pairs(this.actions)) {
      const {
        input: { schema: inputSchema },
        output: { schema: outputSchema },
      } = action

      const resolvedInputSchema = inputSchema(entitySchemas)
      const resolvedOutputSchema = outputSchema(entitySchemas)

      const newActionName = `${prefix}${actionName}`
      actions[newActionName] = {
        input: { schema: resolvedInputSchema },
        output: { schema: resolvedOutputSchema },
      }
    }

    // unreference events
    for (const [eventName, event] of utils.pairs(this.events)) {
      const resolvedEventSchema = event.schema(entitySchemas)
      const newEventName = `${prefix}${eventName}`
      events[newEventName] = { schema: resolvedEventSchema }
    }

    return {
      actions,
      events,
    } as InterfaceInstance<TActions, TEvents>
  }
}
