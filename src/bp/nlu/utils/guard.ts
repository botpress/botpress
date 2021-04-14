import { EntityDefinition } from 'nlu/engine'
import { ListEntityDefinition, PatternEntityDefinition } from 'nlu/typings_v1'

export const isListEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is ListEntityDefinition => {
  return e.type === 'list'
}

export const isPatternEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is PatternEntityDefinition => {
  return e.type === 'pattern'
}

export const filterListEntities = (entities: EntityDefinition[]): ListEntityDefinition[] =>
  entities.filter(isListEntity)

export const filterPatternEntities = (entities: EntityDefinition[]): PatternEntityDefinition[] =>
  entities.filter(isPatternEntity)
