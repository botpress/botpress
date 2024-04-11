import { ZodSchema, z } from '../z/index'
import type { FC } from 'react'
import type { GlobalComponentDefinitions } from '..'
import { zuiKey } from './constants'

export type BaseSchema = {
  description?: string
  [zuiKey]?: {
    tooltip?: boolean
    disabled?: boolean
    displayAs?: [string, any]
    title?: string
    hidden?: boolean
    placeholder?: string
  }
}

export type JSONSchemaPrimitiveType = 'string' | 'number' | 'integer' | 'boolean' | 'null'

export type ArraySchema = {
  type: 'array'
  items: JSONSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minContains?: number
  maxContains?: number
} & BaseSchema

export type ObjectSchema = {
  type: 'object'
  properties: {
    [key: string]: JSONSchema
  }
  required?: string[]
  additionalProperties: boolean
  default?: any
  maxProperties?: number
  minProperties?: number
  dependentRequired?: {
    [key: string]: string[]
  }
} & BaseSchema

export type StringSchema = {
  type: 'string'
  enum?: string[]
  const?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
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
  const?: boolean
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
          : never

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export const containerTypes = ['object', 'array'] as const
export type ContainerType = (typeof containerTypes)[number]

export type UIComponentDefinition = {
  id: string
  type: BaseType
  schema: ZodSchema
}
export type UIComponentDefinitions = UIComponentDefinition[]

export type KeysOfType<UI extends UIComponentDefinitions, Type extends BaseType> = UI extends (infer T)[]
  ? T extends { type: Type; id: string }
    ? T['id']
    : never
  : never

export type SchemaOfType<
  UI extends UIComponentDefinitions,
  Type extends BaseType,
  ID extends KeysOfType<UI, Type> | 'default' = KeysOfType<UI, Type>,
> = UI[number] extends infer T
  ? T extends { id: ID; type: Type; schema: ZodSchema }
    ? z.infer<T['schema']>
    : never
  : never

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
            : U extends { typeName: z.ZodFirstPartyTypeKind.ZodEnum }
              ? 'string'
              : U extends { typeName: z.ZodFirstPartyTypeKind.ZodOptional; innerType: z.ZodTypeAny }
                ? ZodKindToBaseType<U['innerType']['_def']>
                : U extends { typeName: z.ZodFirstPartyTypeKind.ZodNullable; innerType: z.ZodTypeAny }
                  ? ZodKindToBaseType<U['innerType']['_def']>
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
  ID extends KeysOfType<UI, Type>,
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = {
  type: Type
  id: ID
  scope: string
  schema: JSONSchemaOfType<Type>
  zuiProps: BaseSchema[typeof zuiKey]
}

export type FormError = {
  message: string
  path: (string | number)[]
}

export type ZuiReactComponentBaseProps<
  Type extends BaseType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = {
  type: Type
  componentID: ID
  params: ID extends 'default' ? {} : SchemaOfType<UI, Type, ID>
  data: BaseTypeToType<Type> | null
  enabled: boolean
  scope: string
  onChange: (data: any) => void
  schema: JSONSchemaOfType<Type>
  label: string
  errors: FormError[]
  context: {
    path: string
    formValid: boolean | null
    formErrors: FormError[] | null
    formData?: any
    readonly: boolean
    updateForm: (path: string, data: any) => void
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

export type ZuiReactObjectComponentProps<
  Type extends ContainerType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  children: JSX.Element | JSX.Element[]
}

export type ZuiReactArrayComponentProps<
  Type extends ContainerType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  children: JSX.Element | JSX.Element[]
  addItem: (initialData?: any) => void
  removeItem: (index: number) => void
}

export type ZuiReactControlComponentProps<
  Type extends BaseType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  description?: string
  required: boolean
  config: any
}

export type ZuiReactComponentProps<
  Type extends BaseType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = Type extends 'object'
  ? ZuiReactObjectComponentProps<Type, ID, UI>
  : Type extends 'array'
    ? ZuiReactArrayComponentProps<Type, ID, UI>
    : ZuiReactControlComponentProps<Type, ID, UI>

export type ZuiReactComponent<
  Type extends BaseType,
  ID extends KeysOfType<UI, Type> | 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = FC<ZuiReactComponentProps<Type, ID, UI>>

export type ZuiComponentEntry<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = UI extends (infer T)[]
  ? T extends { type: BaseType }
    ? T extends { type: T['type']; id: KeysOfType<UI, T['type']> }
      ? { type: T['type']; id: T['id']; component: ZuiReactComponent<T['type'], T['id'], UI> }
      : { type: T['type']; id: 'default'; component: ZuiReactComponent<T['type'], 'default', UI> }
    : never
  : never

export type ZuiComponentMap<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  components: ZuiComponentEntry<UI>[]
  defaults: ZuiDefaultComponentMap<UI>
}

export type ZuiDefaultComponentMap<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  [T in BaseType]: ZuiReactComponent<T, 'default', UI>
}
