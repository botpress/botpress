import React, { FC, useMemo } from 'react'
import {
  ArraySchema,
  BaseType,
  JSONSchema,
  ObjectSchema,
  PrimitiveSchema,
  ZuiComponentMap,
  ZuiReactArrayChildProps,
  ZuiReactComponent,
  ZuiReactComponentBaseProps,
  ZuiReactComponentProps,
  ZuiReactControlComponentProps,
} from './types'
import { BoundaryFallbackComponent, ErrorBoundary } from './ErrorBoundary'
import { getPathData, useFormData } from './hooks/useFormData'
import { formatTitle, resolveComponent } from './utils'
import { useDiscriminator } from './hooks/useDiscriminator'
import { zuiKey } from './constants'

type FormRendererProps = {
  components: ZuiComponentMap<any>
  fieldSchema: JSONSchema
  path: string[]
  required: boolean
  fallback?: BoundaryFallbackComponent
} & ZuiReactArrayChildProps

export const FormElementRenderer: FC<FormRendererProps> = ({
  components,
  fieldSchema,
  path,
  required,
  fallback,
  ...childProps
}) => {
  const { formData, disabled, hidden, handlePropertyChange, addArrayItem, removeArrayItem, formErrors, formValid } =
    useFormData(fieldSchema, path)
  const data = useMemo(() => getPathData(formData, path), [formData, path])
  const componentMeta = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])
  const { discriminator, discriminatedSchema, discriminatorValue } = useDiscriminator(fieldSchema, path)

  if (!componentMeta) {
    return null
  }

  if (hidden === true) {
    return null
  }

  const { Component: _component, type } = componentMeta

  const baseProps: Omit<ZuiReactComponentBaseProps<BaseType, string, any>, 'data' | 'isArrayChild'> = {
    type,
    componentID: componentMeta.id,
    scope: path.join('.'),
    context: {
      path,
      readonly: false,
      formData,
      formErrors,
      formValid,
      updateForm: handlePropertyChange,
      updateFormData: (data) => handlePropertyChange([], data),
    },
    onChange: (data: any) => handlePropertyChange(path, data),
    disabled,
    errors: formErrors?.filter((e) => e.path === path) || [],
    label: fieldSchema[zuiKey]?.title || formatTitle(path[path.length - 1]?.toString() || ''),
    params: componentMeta.params,
    schema: fieldSchema,
    zuiProps: fieldSchema[zuiKey],
  }

  if (fieldSchema.type === 'array' && type === 'array') {
    const Component = _component as ZuiReactComponent<'array', string, any>
    const schema = baseProps.schema as ArraySchema
    const dataArray = Array.isArray(data) ? data : typeof data === 'object' ? data : []
    const props: Omit<ZuiReactComponentProps<'array', string, any>, 'children'> = {
      ...baseProps,
      type,
      schema,
      data: dataArray,
      addItem: (data) => addArrayItem(path, data),
      removeItem: (index) => removeArrayItem(path, index),
      ...childProps,
    }

    // Tuple
    if (Array.isArray(fieldSchema.items)) {
      return null
    }

    return (
      <Component key={baseProps.scope} {...props} isArrayChild={props.isArrayChild as any}>
        {Array.isArray(props.data)
          ? props.data.map((_, index) => {
              const childPath = [...path, index.toString()]
              return (
                <ErrorBoundary
                  key={childPath.join('.')}
                  fallback={fallback}
                  fieldSchema={fieldSchema.items as JSONSchema}
                  path={childPath}
                >
                  <FormElementRenderer
                    key={childPath.join('.')}
                    components={components}
                    fieldSchema={fieldSchema.items as JSONSchema}
                    path={childPath}
                    required={required}
                    isArrayChild={true}
                    index={index}
                    removeSelf={() => removeArrayItem(path, index)}
                    fallback={fallback}
                  />
                </ErrorBoundary>
              )
            })
          : []}
      </Component>
    )
  }

  if (fieldSchema.type === 'object' && type === 'object' && fieldSchema.properties) {
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
            <ErrorBoundary key={childPath.join('.')} fallback={fallback} fieldSchema={childSchema} path={childPath}>
              <FormElementRenderer
                key={childPath.join('.')}
                components={components}
                fieldSchema={childSchema}
                path={childPath}
                required={fieldSchema.required?.includes(fieldName) || false}
                isArrayChild={false}
                fallback={fallback}
              />
            </ErrorBoundary>
          )
        })}
      </Component>
    )
  }

  if (type === 'discriminatedUnion') {
    const Component = _component as any as ZuiReactComponent<'discriminatedUnion', string, any>

    const props: Omit<ZuiReactComponentProps<'discriminatedUnion', string, any>, 'children'> = {
      ...baseProps,
      type,
      schema: baseProps.schema as any as ObjectSchema,
      data: data || {},
      discriminatorKey: discriminator?.key || null,
      discriminatorLabel: formatTitle(discriminator?.key || 'Unknown'),
      discriminatorOptions: discriminator?.values || null,
      discriminatorValue,
      setDiscriminator: (disc: string) => {
        if (!discriminator?.key) {
          console.warn('No discriminator key found, cannot set discriminator')
          return
        }
        handlePropertyChange(path, { [discriminator.key]: disc })
      },
      ...childProps,
    }

    return (
      <Component key={baseProps.scope} {...props} isArrayChild={props.isArrayChild as any}>
        {discriminatedSchema && (
          <ErrorBoundary key={path.join('.')} fallback={fallback} fieldSchema={discriminatedSchema} path={path}>
            <FormElementRenderer
              components={components}
              fieldSchema={discriminatedSchema}
              path={path}
              required={required}
              isArrayChild={false}
              fallback={fallback}
            />
          </ErrorBoundary>
        )}
      </Component>
    )
  }
  const Component = _component as any as ZuiReactComponent<any, any>

  const props: ZuiReactControlComponentProps<'boolean' | 'number' | 'string', string, any> = {
    ...baseProps,
    type: type as 'boolean' | 'number' | 'string',
    schema: baseProps.schema as PrimitiveSchema,
    config: {},
    required,
    data,
    description: fieldSchema.description,
    ...childProps,
  }

  return <Component {...props} />
}
