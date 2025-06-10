import { ZodEnumDef, ZodIssueCode, z } from '../z/index'
import type { FC } from 'react'
import { zuiKey } from './constants'

export type ZuiMetadata = string | number | boolean | null | undefined | ZuiMetadata[] | { [key: string]: ZuiMetadata }

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

export type SerializedFunction = string
export type BaseSchema = {
  description?: string
  anyOf?: JSONSchema[]
  oneOf?: JSONSchema[]
  allOf?: JSONSchema[]
  not?: JSONSchema
  nullable?: boolean
  [zuiKey]?: ZuiExtensionObject
}

export type JSONSchemaPrimitiveType = 'string' | 'number' | 'integer' | 'boolean' | 'null'

export type ArraySchema = {
  type: 'array'
  items: JSONSchema | JSONSchema[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minContains?: number
  maxContains?: number
  default?: any[]
} & BaseSchema

export type ObjectSchema = {
  type: 'object'
  required?: string[]
  additionalProperties: boolean
  default?: any
  maxProperties?: number
  minProperties?: number
  dependentRequired?: {
    [key: string]: string[]
  }
} & (
  | {
      properties: {
        [key: string]: JSONSchema
      }
      additionalProperties?: false
    }
  | {
      properties?: never
      additionalProperties: JSONSchema
    }
) &
  BaseSchema

// https://json-schema.org/understanding-json-schema/reference/string#built-in-formats
export type Formats =
  | 'date-time'
  | 'time'
  | 'date'
  | 'duration'
  | 'email'
  | 'idn-email'
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uuid'
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uri-template'
  | 'json-pointer'
  | 'relative-json-pointer'
  | 'regex'

export type StringSchema = {
  type: 'string'
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: Formats
  default?: string
} & BaseSchema

export type NumberSchema = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: number[]
  default?: number
} & BaseSchema

export type BooleanSchema = {
  type: 'boolean'
  enum?: boolean[]
  default?: boolean
} & BaseSchema

export type PrimitiveSchema = StringSchema | NumberSchema | BooleanSchema

export type JSONSchema = ArraySchema | ObjectSchema | PrimitiveSchema

export type JSONSchemaOfType<T extends BaseType> = T extends 'string'
  ? StringSchema
  : T extends 'number'
    ? NumberSchema
    : T extends 'boolean'
      ? BooleanSchema
      : T extends 'object'
        ? ObjectSchema
        : T extends 'array'
          ? ArraySchema
          : T extends 'discriminatedUnion'
            ? ObjectSchema
            : never

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'discriminatedUnion'

export const containerTypes = ['object', 'array', 'discriminatedUnion'] as const
export type ContainerType = (typeof containerTypes)[number]

export type UIComponentDefinitions = {
  [T in BaseType]: {
    [K: string]: {
      id: string
      params: z.ZodObject<any>
    }
  }
}

export type ZodKindToBaseType<T extends z.ZodTypeDef> = T extends infer U
  ? U extends { typeName: z.ZodFirstPartyTypeKind.ZodString }
    ? 'string'
    : U extends { typeName: z.ZodFirstPartyTypeKind.ZodNumber }
      ? 'number'
      : U extends { typeName: z.ZodFirstPartyTypeKind.ZodBoolean }
        ? 'boolean'
        : U extends { typeName: z.ZodFirstPartyTypeKind.ZodArray }
          ? 'array'
          : U extends { typeName: z.ZodFirstPartyTypeKind.ZodObject }
            ? 'object'
            : U extends { typeName: z.ZodFirstPartyTypeKind.ZodTuple }
              ? never
              : U extends ZodEnumDef
                ? 'string'
                : U extends { typeName: z.ZodFirstPartyTypeKind.ZodDefault; innerType: z.ZodTypeAny }
                  ? ZodKindToBaseType<U['innerType']['_def']>
                  : U extends { typeName: z.ZodFirstPartyTypeKind.ZodOptional; innerType: z.ZodTypeAny }
                    ? ZodKindToBaseType<U['innerType']['_def']>
                    : U extends { typeName: z.ZodFirstPartyTypeKind.ZodNullable; innerType: z.ZodTypeAny }
                      ? ZodKindToBaseType<U['innerType']['_def']>
                      : U extends {
                            typeName: z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion
                            options: z.ZodDiscriminatedUnionOption<any>[]
                          }
                        ? 'discriminatedUnion'
                        : never
  : never

export type BaseTypeToType<T extends BaseType> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'object'
        ? object
        : T extends 'array'
          ? any[]
          : never

export type AsBaseType<T> = T extends BaseType ? T : never

export type SchemaContext<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = {
  type: Type
  id: ID
  scope: string
  schema: JSONSchemaOfType<Type>
  zuiProps: BaseSchema[typeof zuiKey]
}

export type FormError = {
  message: string
  path: Path
  code: ZodIssueCode
}

export type ZuiReactComponentBaseProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = {
  type: Type
  componentID: ID
  params: ID extends 'default' ? {} : z.infer<UI[Type][ID]['params']>
  data: BaseTypeToType<Type> | null
  disabled: boolean
  scope: string
  onChange: (data: any) => void
  schema: JSONSchemaOfType<Type>
  label: string
  errors: FormError[]
  context: {
    path: Path
    formValid: boolean | null
    formErrors: FormError[] | null
    formData?: any
    readonly: boolean
    updateForm: (path: Path, data: any) => void
    updateFormData: (data: any) => void
  }
  zuiProps: BaseSchema[typeof zuiKey]
} & ZuiReactArrayChildProps

export type ZuiReactArrayChildProps =
  | {
      isArrayChild: true
      index: number
      removeSelf: () => void
    }
  | {
      isArrayChild: false
    }

export type ZuiReactDiscriminatedUnionComponentProps<
  Type extends ContainerType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  discriminatorKey: string | null
  discriminatorLabel: string
  discriminatorOptions: string[] | null
  discriminatorValue: string | null
  setDiscriminator: (discriminator: string) => void
  children: JSX.Element | JSX.Element[] | null
}

export type ZuiReactObjectComponentProps<
  Type extends ContainerType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  children: JSX.Element | JSX.Element[]
}

export type ZuiReactArrayComponentProps<
  Type extends ContainerType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  children: JSX.Element | JSX.Element[]
  addItem: (initialData?: any) => void
  removeItem: (index: number) => void
}

export type ZuiReactControlComponentProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  description?: string
  required: boolean
  config: any
}

export type ZuiReactComponentProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = Type extends 'object'
  ? ZuiReactObjectComponentProps<Type, ID, UI>
  : Type extends 'array'
    ? ZuiReactArrayComponentProps<Type, ID, UI>
    : Type extends 'discriminatedUnion'
      ? ZuiReactDiscriminatedUnionComponentProps<Type, ID, UI>
      : ZuiReactControlComponentProps<Type, ID, UI>

export type ZuiReactComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = UIComponentDefinitions,
> = FC<ZuiReactComponentProps<Type, ID, UI>>

export type ZuiComponentMap<UI extends UIComponentDefinitions = UIComponentDefinitions> = {
  [T in BaseType]: {
    [K in keyof UI[T]]: ZuiReactComponent<T, K, UI>
  } & {
    default?: ZuiReactComponent<T, 'default', UI>
  }
}

export type ParseSchema<I> = I extends infer U
  ? U extends { id: string; params: z.AnyZodObject }
    ? {
        id: U['id']
        params: z.infer<U['params']>
      }
    : object
  : never

export type Merge<A, B> = Omit<A, keyof B> & B
export type MergeUIComponentDefinitions<T extends UIComponentDefinitions, U extends UIComponentDefinitions> = {
  [Type in BaseType]: Merge<T[Type], U[Type]>
}

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T
export type Path = (string | number)[]

export type FormValidation =
  | {
      formValid: false
      formErrors: FormError[]
    }
  | {
      formValid: true
      formErrors: []
    }
  | {
      formValid: null
      formErrors: null
    }
