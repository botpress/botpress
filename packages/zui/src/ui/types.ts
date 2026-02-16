import { ZodTypeDef, ZodType, TypeOf } from '../z/types/basetype'
import { ZodObject } from '../z/types/object'

export type ZuiMetadata = string | number | boolean | null | undefined | ZuiMetadata[] | { [key: string]: ZuiMetadata }

type SerializedFunction = string
export type ZuiExtensionObject = {
  tooltip?: boolean
  displayAs?: [string, any]
  title?: string
  disabled?: boolean | SerializedFunction
  hidden?: boolean | SerializedFunction
  placeholder?: string
  secret?: boolean
  coerce?: boolean
  [key: string]: ZuiMetadata
}

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'discriminatedUnion'

export type ContainerType = 'object' | 'array' | 'discriminatedUnion'

export type UIComponentDefinitions = {
  [T in BaseType]: {
    [K: string]: {
      id: string
      params: ZodObject<any>
    }
  }
}

export type ZodKindToBaseType<T extends ZodTypeDef> = T extends infer U
  ? U extends { typeName: 'ZodString' }
    ? 'string'
    : U extends { typeName: 'ZodNumber' }
      ? 'number'
      : U extends { typeName: 'ZodBoolean' }
        ? 'boolean'
        : U extends { typeName: 'ZodArray' }
          ? 'array'
          : U extends { typeName: 'ZodObject' }
            ? 'object'
            : U extends { typeName: 'ZodTuple' }
              ? never
              : U extends { typeName: 'ZodEnum' }
                ? 'string'
                : U extends { typeName: 'ZodDefault'; innerType: ZodType }
                  ? ZodKindToBaseType<U['innerType']['_def']>
                  : U extends { typeName: 'ZodOptional'; innerType: ZodType }
                    ? ZodKindToBaseType<U['innerType']['_def']>
                    : U extends { typeName: 'ZodNullable'; innerType: ZodType }
                      ? ZodKindToBaseType<U['innerType']['_def']>
                      : U extends { typeName: 'ZodDiscriminatedUnion' }
                        ? 'discriminatedUnion'
                        : never
  : never

export type ParseSchema<I> = I extends infer U
  ? U extends { id: string; params: ZodObject }
    ? {
        id: U['id']
        params: TypeOf<U['params']>
      }
    : object
  : never
