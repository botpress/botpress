import {
  BaseType,
  ContainerType,
  SchemaContext,
  UIComponentDefinitions,
  UIControlSchema,
  UILayoutSchema,
  ZuiComponentMap,
  ZuiReactControlComponentProps,
  ZuiReactLayoutComponentProps,
  containerTypes,
  SchemaResolversMap,
  JSONSchema,
  UISchema,
} from './types'
import { zuiKey } from '../zui'
import {
  JsonForms,
  type JsonFormsInitStateProps,
  type JsonFormsReactProps,
  JsonFormsDispatch,
  withJsonFormsControlProps,
  withJsonFormsLayoutProps,
} from '@jsonforms/react'
import { useMemo } from 'react'
import { ControlProps, JsonFormsProps, JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import React, { FC } from 'react'
import { GlobalComponentDefinitions } from '..'

export type ZuiFormProps<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = Omit<
  JsonFormsInitStateProps,
  'uischema' | 'schema' | 'renderers' | 'cells'
> &
  JsonFormsReactProps & {
    overrides?: SchemaResolversMap<UI>
    components: ZuiComponentMap<UI>
    schema: JSONSchema | any
  }

export const defaultControlResolver = (
  params: any,
  ctx: SchemaContext<'string' | 'number' | 'boolean', string>,
): UIControlSchema => {
  return {
    type: 'Control',
    scope: ctx.scope,
    _componentType: ctx.type,
    _componentID: ctx.id,
    label: ctx.zuiProps?.title ?? true,
    options: params,
    [zuiKey]: ctx.zuiProps,
  }
}

export const defaultContainerResolver = (
  params: any,
  ctx: SchemaContext<ContainerType, string>,
  children: UISchema[],
): UILayoutSchema => {
  return {
    type: 'HorizontalLayout',
    _componentType: ctx.type,
    _componentID: ctx.id,
    elements: children,
    options: {
      params,
    },
    [zuiKey]: ctx.zuiProps,
  }
}

export const defaultUISchemaResolvers: SchemaResolversMap<UIComponentDefinitions> = {
  string: {
    default: defaultControlResolver,
  },
  number: {
    default: defaultControlResolver,
  },
  boolean: {
    default: defaultControlResolver,
  },
  object: {
    default: defaultContainerResolver,
  },
  array: {
    default: defaultContainerResolver,
  },
}

const getSchemaResolver = <Type extends BaseType, UI extends UIComponentDefinitions = GlobalComponentDefinitions>(
  type: Type,
  id: keyof UI[BaseType] & string,
  overrides: SchemaResolversMap<UI> = {},
) => {
  const typeResolvers = { ...defaultUISchemaResolvers[type], ...overrides[type] }
  const componentFunc = typeResolvers?.[id] || typeResolvers?.default
  if (!componentFunc) {
    return null
  }
  return componentFunc
}

const keyToScope = (key: string) => {
  return '#/properties/' + key
}

export const schemaToUISchema = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>(
  schema: JSONSchema,
  overrides: SchemaResolversMap<UI> = {},
  currentKey: string = 'root',
): UISchema | null => {
  const scope = keyToScope(currentKey)

  const zuiProps = schema[zuiKey] ?? {}

  if (zuiProps.hidden === true) {
    return null
  }
  if (zuiProps)
    if (schema.type === 'object') {
      const properties = Object.entries(schema.properties)
        .map(([key, value]) => {
          return schemaToUISchema(value, overrides, key)
        })
        .filter(Boolean) as UISchema[]

      if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
        const resolver = getSchemaResolver(schema.type, 'default', overrides)
        return resolver?.({}, { type: 'object', id: 'default', schema, scope, zuiProps }, properties) || null
      }

      const [id, params] = schema[zuiKey].displayAs
      const resolver = getSchemaResolver(schema.type, id, overrides)

      return resolver?.(params, { type: schema.type, id: id as any, schema, scope, zuiProps }, properties) || null
    }

  if (schema.type === 'array') {
    const items = schemaToUISchema(schema.items, overrides, currentKey)
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const resolver = getSchemaResolver(schema.type, 'default', overrides)
      return (
        resolver?.(
          {},
          { type: 'array', id: 'default', schema, scope, zuiProps },
          [items].filter(Boolean) as UISchema[],
        ) || null
      )
    }
    const [id, params] = schema[zuiKey].displayAs
    const resolver = getSchemaResolver(schema.type, id, overrides)
    return (
      resolver?.(
        params,
        { type: schema.type, id: id as any, schema, scope, zuiProps },
        [items].filter(Boolean) as UISchema[],
      ) || null
    )
  }

  if (schema.type === 'string' || schema.type === 'boolean' || schema.type === 'number') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const resolver = getSchemaResolver(schema.type, 'default', overrides) as any
      return resolver?.({}, { type: schema.type, id: 'default', scope, zuiProps }) || null
    }
    const [id, params] = schema[zuiKey].displayAs
    const resolver = getSchemaResolver(schema.type, id, overrides) as any
    return resolver?.(params, { type: schema.type, id, schema, scope, zuiProps }) || null
  }

  console.error('No component function found for', schema.type, schema)

  return null
}

const transformControlProps = <Type extends BaseType>(
  type: Type,
  id: string,
  props: ControlProps,
): ZuiReactControlComponentProps<Type, string> => {
  const {
    uischema,
    id: renderID,
    schema,
    renderers,
    path,
    cells,
    enabled,
    handleChange,
    required,
    data,
    errors,
    label,
    description,
    config,
    i18nKeyPrefix,
  } = props
  const transformedProps: ZuiReactControlComponentProps<Type, string> = {
    type,
    id: renderID,
    componentID: id,
    params: uischema?.options,
    scope: path!,
    enabled: enabled,
    required: required ?? false,
    data,
    errors,
    label,
    description,
    config,
    i18nKeyPrefix,
    zuiProps: (uischema as any)[zuiKey] ?? {},
    onChange: (data) => handleChange(path, data),
    schema: schema as any,
    context: {
      path: path!,
      uiSchema: uischema as any,
      renderers: renderers!,
      cells: cells!,
    },
  }

  return transformedProps
}

const withTransformControlProps = (type: BaseType, id: string, Component: FC<any>) => {
  return withJsonFormsControlProps((props) => {
    const transformedProps = transformControlProps(type, id, props)
    return <Component {...transformedProps} />
  })
}

const transformLayoutProps = <Type extends ContainerType>(
  type: Type,
  id: string,
  props: any,
): ZuiReactLayoutComponentProps<ContainerType, string> => {
  const { uischema, id: renderID, schema, renderers, path, cells, enabled, handleChange, data } = props

  return {
    type,
    id: renderID,
    componentID: id,
    enabled,
    params: uischema.options,
    scope: path!,
    onChange: (data) => handleChange(path, data),
    schema: schema as any,
    context: {
      path: path!,
      uiSchema: uischema! as any,
      renderers: renderers!,
      cells: cells!,
    },
    data,
    zuiProps: (uischema as any)[zuiKey] ?? {},
    children: uischema.elements?.map((child: any, index: number) => {
      return (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          renderers={renderers}
          cells={cells}
          uischema={child}
          schema={schema}
          path={path}
          enabled={enabled}
        />
      )
    }),
  }
}

const withTransformLayoutProps = (type: ContainerType, id: string, Component: FC<any>) => {
  return withJsonFormsLayoutProps((props: any) => {
    const transformedProps = transformLayoutProps(type, id, props)
    return <Component {...transformedProps} />
  })
}

type JSONFormsRenderer = JsonFormsRendererRegistryEntry

export const transformZuiComponentsToRenderers = (
  components: ZuiComponentMap,
): NonNullable<JsonFormsProps['renderers']> => {
  return Object.entries(components)
    .map(([type, ids]) => {
      return Object.entries(ids).map<JSONFormsRenderer>(([id, component]) => {
        if (containerTypes.includes(type as ContainerType)) {
          return {
            tester: (uischema: any, _, __) => {
              return uischema?._componentType === type && uischema?._componentID === id ? 100 : 0
            },
            renderer: withTransformLayoutProps(type as ContainerType, id, component),
          }
        }
        return {
          tester: (uischema: any, _, __) => {
            return uischema?.type === 'Control' && uischema._componentType === type && uischema?._componentID === id
              ? 100
              : 0
          },
          renderer: withTransformControlProps(type as BaseType, id, component),
        }
      })
    })
    .reduce((acc, val) => acc.concat(val), [])
}

export function ZuiForm<UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  overrides = {},
  components,
  ...jsonformprops
}: ZuiFormProps<UI>): React.ReactNode | null {
  const renderers = useMemo(() => {
    return transformZuiComponentsToRenderers(components)
  }, [components])

  const uiSchema = useMemo(() => {
    return schemaToUISchema<UI>(schema, overrides)
  }, [schema, overrides])

  if (!uiSchema) {
    console.warn('UI Schema returned null, skipping form rendering')
    return null
  }

  return <JsonForms {...jsonformprops} schema={schema} uischema={uiSchema} renderers={renderers} />
}
