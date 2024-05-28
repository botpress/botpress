import { AnyZodObject } from '../type-utils'
import { GenericZuiSchema } from '../zui'
import { ActionDefinition, EntityDefinition, EventDefinition, InterfaceInstance } from './definition'

const pairs = <K extends string, V>(obj: Record<K, V>) => Object.entries(obj) as [K, V][]
const mapValues = <K extends string, V, R>(obj: Record<K, V>, fn: (value: V, key: K) => R): Record<K, R> =>
  Object.fromEntries(pairs(obj).map(([key, value]) => [key, fn(value, key)])) as Record<K, R>

type BaseEntities = Record<string, AnyZodObject>

type GenericEventDefinition<TEntities extends BaseEntities> = {
  schema: GenericZuiSchema<TEntities>
}

type GenericActionDefinition<TEntities extends BaseEntities> = {
  input: { schema: GenericZuiSchema<TEntities> }
  output: { schema: GenericZuiSchema<TEntities> }
}

export type InterfaceDeclarationProps<TEntities extends BaseEntities = BaseEntities> = {
  name: string

  events: { [K: string]: GenericEventDefinition<TEntities> }

  actions: {
    [K: string]: GenericActionDefinition<TEntities>
  }

  entities: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }
}

export type InterfaceResolveProps<TEntities extends BaseEntities = BaseEntities> = {
  entities: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }
  prefix?: string
}

export class InterfaceDeclaration<TEntities extends BaseEntities = BaseEntities> {
  public readonly entities: this['props']['entities']
  public readonly name: this['props']['name']
  public readonly events: this['props']['events']
  public readonly actions: this['props']['actions']

  public constructor(public readonly props: InterfaceDeclarationProps<TEntities>) {
    this.name = props.name
    this.events = props.events
    this.actions = props.actions
    this.entities = props.entities
  }

  public resolve(props: InterfaceResolveProps<TEntities>): InterfaceInstance {
    const { entities, prefix } = props

    const entitySchemas = mapValues(entities, (entity) => entity.schema) as unknown as TEntities

    const actions: Record<string, ActionDefinition> = {}
    const events: Record<string, EventDefinition> = {}

    // unreference actions
    for (const [actionName, action] of pairs(this.actions)) {
      const {
        input: { schema: inputSchema },
        output: { schema: outputSchema },
      } = action

      const resolvedInputSchema = inputSchema(entitySchemas)
      const resolvedOutputSchema = outputSchema(entitySchemas)
      actions[actionName] = {
        input: { schema: resolvedInputSchema },
        output: { schema: resolvedOutputSchema },
      }
    }

    // unreference events
    for (const [eventName, event] of pairs(this.events)) {
      const resolvedEventSchema = event.schema(entitySchemas)
      events[eventName] = { schema: resolvedEventSchema }
    }

    return {
      name: this.name,
      actions,
      events,
      prefix,
    }
  }
}
