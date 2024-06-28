import * as utils from '../../utils'
import { z } from '../../zui'

const schemaName = Symbol('schemaName')

type BaseSchemas = Record<string, z.ZodSchema>

export type SchemaStoreProps<TSchemas extends BaseSchemas = BaseSchemas> = {
  [K in keyof TSchemas]: {
    schema: TSchemas[K]
  }
}

export type BrandedSchema<TSchema extends BaseSchemas[string] = BaseSchemas[string]> = {
  schema: TSchema
  [schemaName]: string
}

export type SchemaStore<TSchemas extends BaseSchemas = BaseSchemas> = {
  [K in keyof TSchemas]: BrandedSchema<TSchemas[K]>
}

export const createStore = <TSchemas extends BaseSchemas>(
  props: SchemaStoreProps<TSchemas> | undefined
): SchemaStore<TSchemas> => {
  if (!props) {
    return {} as SchemaStore<TSchemas>
  }
  const store: SchemaStore<BaseSchemas> = utils.mapValues(props, (e, k) => ({ ...e, [schemaName]: k }))
  return store as SchemaStore<TSchemas>
}

export const isBranded = (schema: BrandedSchema): boolean => {
  return schema[schemaName] !== undefined
}

export const getName = (schema: BrandedSchema): string => {
  return schema[schemaName]
}
