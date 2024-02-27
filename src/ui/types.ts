import type { ZodSchema, ZodType, z } from 'zod'
import type { Rule } from '@jsonforms/core'
import { zuiKey } from '../zui'
import { FC } from 'react'
import { GlobalComponentDefinitions } from '..'

export type ZuiSchemaExtension = {
  [zuiKey]: {
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
} & ZuiSchemaExtension

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
} & ZuiSchemaExtension

export type StringSchema = {
  type: 'string'
  enum?: string[]
  const?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  default?: string
} & ZuiSchemaExtension

export type NumberSchema = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: number[]
} & ZuiSchemaExtension

export type BooleanSchema = {
  type: 'boolean'
  enum?: boolean[]
  const?: boolean
} & ZuiSchemaExtension

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

export type UILayoutSchema =
  | ({
      type: 'VerticalLayout' | 'HorizontalLayout'
      _componentType: BaseType
      _componentID: string
      elements: UISchema[]
      rule?: UIRuleSchema
    } & OptionsSchemaFragment)
  | ({
      type: 'Group'
      _componentType: BaseType
      _componentID: string
      label?: string
      elements: UISchema[]
      rule?: UIRuleSchema
    } & OptionsSchemaFragment)
  | ({
      type: 'Categorization'
      _componentType: BaseType
      _componentID: string
      elements: UICategorySchema[]
      rule?: UIRuleSchema
    } & OptionsSchemaFragment)

export type UICategorySchema = {
  type: 'Category'
  _componentType: BaseType
  _componentID: string
  label?: string
  elements: UISchema[]
  rule?: UIRuleSchema
} & OptionsSchemaFragment

export type UIControlSchema = {
  type: 'Control'
  scope: string
  label?: string | boolean
  _componentType: BaseType
  _componentID: string
  rule?: UIRuleSchema
} & OptionsSchemaFragment

type OptionsSchemaFragment = {
  options?: {
    [key: string]: any
  }
  [key: string]: any
}

export type UIRuleSchema = Rule

export type UISchema = UIControlSchema | UILayoutSchema | UICategorySchema

export type UISchemaType = UISchema['type']

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export const containerTypes = ['object', 'array'] as const
export type ContainerType = (typeof containerTypes)[number]

export type UIComponentDefinitions = {
  [type in BaseType]: {
    [id: string | number | symbol]: {
      id: string
      schema: ZodSchema
    }
  }
}

export type ZodToBaseType<T extends ZodType> = T extends z.ZodString
  ? 'string'
  : T extends z.ZodBoolean
  ? 'boolean'
  : T extends z.ZodNumber
  ? 'number'
  : T extends z.ZodArray<any, any>
  ? 'array'
  : T extends z.ZodObject<any, any>
  ? 'object'
  : T extends z.ZodEnum<[string, ...string[]]>
  ? 'string'
  : any

export type AsBaseType<T> = T extends BaseType ? T : never

export type SchemaResolversMap<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  [Type in keyof UI]?: {
    [ID in keyof UI[Type]]?: SchemaResolver<AsBaseType<Type>, ID, UI>
  } & {
    default?: SchemaResolver<AsBaseType<Type>, 'default', UI>
  }
}

export type SchemaContext<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = {
  type: Type
  id: ID
  scope: string
  schema: JSONSchemaOfType<Type>
  zuiProps: ZuiSchemaExtension[typeof zuiKey]
}

export type SchemaResolver<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = Type extends ContainerType
  ? (
      params: z.infer<UI[Type][ID]['schema']>,
      context: SchemaContext<Type, ID, UI>,
      children: UISchema[],
    ) => UISchema | null
  : (params: z.infer<UI[Type][ID]['schema']>, context: SchemaContext<Type, ID, UI>) => UISchema | null

export type ZuiReactComponentBaseProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = {
  type: Type
  componentID: ID
  id: string
  params: z.infer<UI[Type][ID]['schema']>
  data: any
  enabled: boolean
  scope: string
  onChange: (data: any) => void
  schema: JSONSchemaOfType<Type>
  context: {
    path: string
    uiSchema: Type extends ContainerType ? UILayoutSchema : UIControlSchema
    renderers: any[]
    cells: any[]
  }
  i18nKeyPrefix?: string
  zuiProps: ZuiSchemaExtension[typeof zuiKey]
}

export type ZuiReactLayoutComponentProps<
  Type extends ContainerType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  children: JSX.Element | JSX.Element[]
}

export type ZuiReactControlComponentProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = ZuiReactComponentBaseProps<Type, ID, UI> & {
  label: string
  errors: string
  description?: string
  required: boolean
  config: any
}

export type ZuiReactComponentProps<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = Type extends ContainerType
  ? ZuiReactLayoutComponentProps<Type, ID, UI>
  : ZuiReactControlComponentProps<Type, ID, UI>

export type ZuiReactComponent<
  Type extends BaseType,
  ID extends keyof UI[Type] = 'default',
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = FC<ZuiReactComponentProps<Type, ID, UI>>

export type ZuiComponentMap<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  [Type in BaseType]: {
    [ID in keyof UI[Type]]: ZuiReactComponent<Type, ID, UI>
  } & {
    default: ZuiReactComponent<Type, 'default', UI>
  }
}
