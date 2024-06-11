import { Cast } from '../../type-utils'
import * as utils from '../../utils'
import { BaseEntities } from './generic'

const entityKey = Symbol('entityKey')

export type EntityStoreProps<TEntities extends BaseEntities = BaseEntities> = {
  [K in keyof TEntities]: {
    schema: TEntities[K]
  }
}

export type BrandedEntity<
  TEntity extends BaseEntities[string] = BaseEntities[string],
  TBrand extends string = string
> = {
  schema: TEntity
  [entityKey]: TBrand
}

export type EntityStore<TEntities extends BaseEntities = BaseEntities> = {
  [K in keyof TEntities]: BrandedEntity<TEntities[K], Cast<K, string>>
}

export const createStore = <TEntities extends BaseEntities>(
  props: EntityStoreProps<TEntities> | undefined
): EntityStore<TEntities> => {
  if (!props) {
    return {} as EntityStore<TEntities>
  }

  const store: EntityStore<BaseEntities> = utils.mapValues(props, (e, k) => ({ ...e, [entityKey]: k }))
  return store as EntityStore<TEntities>
}

export const isBranded = (entity: BrandedEntity): boolean => {
  return entity[entityKey] !== undefined
}

export const getName = (entity: BrandedEntity): string => {
  return entity[entityKey]
}
