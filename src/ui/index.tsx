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
} from './types'
import { zuiKey } from './constants'
import React, { type FC, useMemo } from 'react'
import { GlobalComponentDefinitions } from '..'
import { FormDataProvider, getDefaultItemData, useFormData } from './providers/FormDataProvider'
import { getPathData } from './providers/FormDataProvider'
import { formatTitle } from './titleutils'

type ComponentMeta<Type extends BaseType = BaseType> = {
  type: Type
  Component: ZuiReactComponent<Type, 'default'>
  id: string
  params: any
}

const resolveComponent = <Type extends BaseType>(
  components: ZuiComponentMap<any[]> | undefined,
  fieldSchema: JSONSchema,
): ComponentMeta<Type> | null => {
  const type = fieldSchema.type as BaseType
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components?.defaults[type]

    if (!defaultComponent) {
      return null
    }

    return {
      Component: defaultComponent as ZuiReactComponent<Type, 'default'>,
      type: type as Type,
      id: 'default',
      params: {},
    }
  }

  const componentID: string = uiDefinition[0]

  const Component =
    (components?.components.find((c) => c.type === type && c.id === componentID)?.component as ZuiReactComponent<
      Type,
      any
    >) || null

  if (!Component) {
    console.warn(`Component ${type}.${componentID} not found`)
    return null
  }

  const params = uiDefinition[1] || {}

  return {
    Component: Component as ZuiReactComponent<Type, 'default'>,
    type: type as Type,
    id: componentID,
    params,
  }
}

export type ZuiFormProps<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  schema: JSONSchema
  components: ZuiComponentMap<UI>
  value: any
  onChange: (value: any) => void
  disableValidation?: boolean
}

export const ZuiForm = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
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

  const pathString = path.length > 0 ? path.join('.') : 'root'

  const baseProps: Omit<ZuiReactComponentBaseProps<BaseType, any>, 'data' | 'isArrayChild'> = {
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
    const Component = _component as any as ZuiReactComponent<'array', any>
    const schema = baseProps.schema as ArraySchema

    const props: Omit<ZuiReactComponentProps<'array', any>, 'children'> = {
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
    const Component = _component as any as ZuiReactComponent<'object', any>
    const props: Omit<ZuiReactComponentProps<'object', any>, 'children'> = {
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
  const Component = _component as any as ZuiReactComponent<any, any>

  const props: ZuiReactControlComponentProps<'boolean' | 'number' | 'string', any> = {
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
