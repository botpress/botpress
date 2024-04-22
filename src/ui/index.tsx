import {
  BaseType,
  UIComponentDefinitions,
  ZuiComponentMap,
  JSONSchema,
  ZuiReactComponent,
  ZuiReactComponentBaseProps,
  ObjectSchema,
  ArraySchema,
  ZuiReactComponentProps,
  ZuiReactControlComponentProps,
  PrimitiveSchema,
  ZuiReactArrayChildProps,
  DefaultComponentDefinitions,
} from './types'
import { ROOT, zuiKey } from './constants'
import React, { type FC, useMemo, useEffect } from 'react'
import { FormDataProvider, getDefaultItemData, useFormData } from './providers/FormDataProvider'
import { getPathData } from './providers/FormDataProvider'
import { formatTitle } from './titleutils'

type ComponentMeta<Type extends BaseType = BaseType> = {
  type: Type
  Component: ZuiReactComponent<Type, 'default', any>
  id: string
  params: any
}

export const getSchemaType = (schema: JSONSchema): BaseType => {
  if (schema.anyOf?.length) {
    const discriminator = resolveDiscriminator(schema.anyOf)
    return discriminator ? 'discriminatedUnion' : 'object'
  }
  if (schema.type === 'integer') {
    return 'number'
  }

  return schema.type
}

const resolveComponent = <Type extends BaseType>(
  components: ZuiComponentMap<any> | undefined,
  fieldSchema: JSONSchema,
): ComponentMeta<Type> | null => {
  const type = getSchemaType(fieldSchema)
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components?.[type]?.default

    if (!defaultComponent) {
      return null
    }

    return {
      Component: defaultComponent as ZuiReactComponent<Type, 'default', any>,
      type: type as Type,
      id: 'default',
      params: {},
    }
  }

  const componentID: string = uiDefinition[0]

  const Component = components?.[type]?.[componentID] || null

  if (!Component) {
    console.warn(`Component ${type}.${componentID} not found`)
    return null
  }

  const params = uiDefinition[1] || {}

  return {
    Component: Component as ZuiReactComponent<Type, 'default', any>,
    type: type as Type,
    id: componentID,
    params,
  }
}

export const resolveDiscriminator = (anyOf: ObjectSchema['anyOf']) => {
  const output = anyOf
    ?.map((schema) => {
      if (schema.type !== 'object') {
        return null
      }
      return Object.entries(schema.properties)
        .map(([key, def]) => {
          if (def.type === 'string' && def.const?.length) {
            return { key, value: def.const }
          }
          return null
        })
        .filter((v): v is { key: string; value: string } => !!v)
    })
    .flat()
    .reduce(
      (acc, data) => {
        if (!data) {
          return acc
        }
        const { key, value } = data
        if (acc.key === null) {
          acc.key = key
        }
        if (acc.key === key) {
          acc.values.push(value)
        }

        return acc
      },
      { key: null as string | null, values: [] as string[] },
    )

  if (output?.key === null || !output?.values.length) {
    return null
  }
  return output
}

export const resolveDiscriminatedSchema = (key: string | null, value: string | null, anyOf: ObjectSchema['anyOf']) => {
  if (!anyOf?.length || !key || !value) {
    return null
  }
  for (const schema of anyOf) {
    if (schema.type !== 'object') {
      continue
    }
    const discriminator = schema.properties[key]
    if (discriminator?.type === 'string' && discriminator.const === value) {
      return {
        ...schema,
        properties: {
          ...schema.properties,
          [key]: { ...discriminator, [zuiKey]: { hidden: true } },
        },
      } as ObjectSchema
    }
  }
  return null
}

export type ZuiFormProps<UI extends UIComponentDefinitions = DefaultComponentDefinitions> = {
  schema: JSONSchema
  components: ZuiComponentMap<UI>
  value: any
  onChange: (value: any) => void
  disableValidation?: boolean
}

export const ZuiForm = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>({
  schema,
  components,
  onChange,
  value,
  disableValidation,
}: ZuiFormProps<UI>): JSX.Element | null => {
  return (
    <FormDataProvider
      formData={value}
      setFormData={onChange}
      formSchema={schema}
      disableValidation={disableValidation || false}
    >
      <FormElementRenderer
        components={components as any}
        fieldSchema={schema}
        path={[]}
        required={true}
        isArrayChild={false}
      />
    </FormDataProvider>
  )
}

type FormRendererProps = {
  components: ZuiComponentMap<any>
  fieldSchema: JSONSchema
  path: string[]
  required: boolean
} & ZuiReactArrayChildProps

const FormElementRenderer: FC<FormRendererProps> = ({ components, fieldSchema, path, required, ...childProps }) => {
  const { formData, handlePropertyChange, addArrayItem, removeArrayItem, formErrors, formValid } = useFormData()
  const data = useMemo(() => getPathData(formData, path), [formData, path])
  const componentMeta = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])

  if (!componentMeta) {
    return null
  }

  if (fieldSchema[zuiKey]?.hidden === true) {
    return null
  }

  const { Component: _component, type } = componentMeta

  const pathString = path.length > 0 ? path.join('.') : ROOT

  const baseProps: Omit<ZuiReactComponentBaseProps<BaseType, string, any>, 'data' | 'isArrayChild'> = {
    type,
    componentID: componentMeta.id,
    scope: pathString,
    context: {
      path: pathString,
      readonly: false,
      formData,
      formErrors,
      formValid,
      updateForm: handlePropertyChange,
    },
    enabled: fieldSchema[zuiKey]?.disabled !== true,
    onChange: (data: any) => handlePropertyChange(pathString, data),
    errors: formErrors?.filter((e) => e.path.join('.') === pathString) || [],
    label: fieldSchema[zuiKey]?.title || formatTitle(path[path.length - 1]?.toString() || ''),
    params: componentMeta.params,
    schema: fieldSchema,
    zuiProps: fieldSchema[zuiKey],
  }

  if (fieldSchema.type === 'array' && type === 'array') {
    const Component = _component as any as ZuiReactComponent<'array', string, any>
    const schema = baseProps.schema as ArraySchema

    const props: Omit<ZuiReactComponentProps<'array', string, any>, 'children'> = {
      ...baseProps,
      type,
      schema,
      data: Array.isArray(data) ? data : [],
      addItem: (data = undefined) =>
        addArrayItem(baseProps.context.path, typeof data === 'undefined' ? getDefaultItemData(schema.items) : data),
      removeItem: (index) => removeArrayItem(baseProps.context.path, index),
      ...childProps,
    }

    return (
      <Component key={baseProps.scope} {...props} isArrayChild={props.isArrayChild as any}>
        {props.data?.map((_, index) => {
          const childPath = [...path, index.toString()]
          return (
            <FormElementRenderer
              key={childPath.join('.')}
              components={components}
              fieldSchema={fieldSchema.items}
              path={childPath}
              required={required}
              isArrayChild={true}
              index={index}
              removeSelf={() => removeArrayItem(baseProps.context.path, index)}
            />
          )
        }) || []}
      </Component>
    )
  }

  if (fieldSchema.type === 'object' && type === 'object') {
    const Component = _component as any as ZuiReactComponent<'object', string, any>
    const props: Omit<ZuiReactComponentProps<'object', string, any>, 'children'> = {
      ...baseProps,
      type,
      schema: baseProps.schema as any as ObjectSchema,
      data: data || {},
      ...childProps,
    }
    return (
      <Component key={baseProps.scope} {...props} isArrayChild={props.isArrayChild as any}>
        {Object.entries(fieldSchema.properties).map(([fieldName, childSchema]) => {
          const childPath = [...path, fieldName]
          return (
            <FormElementRenderer
              key={childPath.join('.')}
              components={components}
              fieldSchema={childSchema}
              path={childPath}
              required={fieldSchema.required?.includes(fieldName) || false}
              isArrayChild={false}
            />
          )
        })}
      </Component>
    )
  }

  if (type === 'discriminatedUnion') {
    const Component = _component as any as ZuiReactComponent<'discriminatedUnion', string, any>

    const discriminator = useMemo(() => resolveDiscriminator(fieldSchema.anyOf), [fieldSchema.anyOf])
    const discriminatorValue = discriminator?.key ? data?.[discriminator.key] : null
    useEffect(() => {
      if (discriminator?.key && discriminator?.values.length) {
        handlePropertyChange(pathString, { [discriminator.key]: discriminator.values[0] })
      }
    }, [])
    const props: Omit<ZuiReactComponentProps<'discriminatedUnion', string, any>, 'children'> = {
      ...baseProps,
      type,
      schema: baseProps.schema as any as ObjectSchema,
      data: data || {},
      discriminatorKey: discriminator?.key || null,
      discriminatorOptions: discriminator?.values || null,
      discriminatorValue,
      setDiscriminator: (disc: string) => {
        if (!discriminator?.key) {
          console.warn('No discriminator key found, cannot set discriminator')
          return
        }
        handlePropertyChange(pathString, { [discriminator.key]: disc })
      },
      ...childProps,
    }
    const discriminatedSchema = useMemo(
      () => resolveDiscriminatedSchema(discriminator?.key || null, discriminatorValue, fieldSchema.anyOf),
      [fieldSchema.anyOf, data, discriminator?.key],
    )

    return (
      <Component key={baseProps.scope} {...props} isArrayChild={props.isArrayChild as any}>
        {discriminatedSchema && (
          <FormElementRenderer
            components={components}
            fieldSchema={discriminatedSchema}
            path={path}
            required={required}
            key={path.join('.')}
            isArrayChild={false}
          />
        )}
      </Component>
    )
  }
  const Component = _component as any as ZuiReactComponent<any, any>

  const props: ZuiReactControlComponentProps<'boolean' | 'number' | 'string', string, any> = {
    ...baseProps,
    type: type as any as 'boolean' | 'number' | 'string',
    schema: baseProps.schema as any as PrimitiveSchema,
    config: {},
    required,
    data,
    description: fieldSchema.description,
    ...childProps,
  }

  return <Component {...props} />
}
