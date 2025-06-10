import React, { useState, useEffect } from 'react'
import { BoundaryFallbackComponent, ErrorBoundary } from './ErrorBoundary'
import { FormDataProvider, deepMerge, getDefaultValues } from './hooks/useFormData'
import { FormValidation, JSONSchema, UIComponentDefinitions, ZuiComponentMap } from './types'
import { FormElementRenderer } from './ElementRenderer'

export type ZuiFormProps<UI extends UIComponentDefinitions = UIComponentDefinitions> = {
  schema: JSONSchema
  components: ZuiComponentMap<UI>
  value: any
  onChange: (value: any) => void
  disableValidation?: boolean
  fallback?: BoundaryFallbackComponent
  dataTransform?: (data: any) => any
  onValidation?: (validation: FormValidation) => void
}

export const ZuiForm = <UI extends UIComponentDefinitions = UIComponentDefinitions>({
  schema,
  components,
  onChange,
  value,
  disableValidation,
  fallback,
  dataTransform,
  onValidation,
}: ZuiFormProps<UI>): JSX.Element | null => {
  const [formData, setFormData] = useState<object>(value)

  useEffect(() => {
    onChange(formData)
  }, [formData])

  useEffect(() => {
    const defaults = getDefaultValues(schema)
    setFormData((prev) => deepMerge(defaults, prev))
  }, [JSON.stringify(schema), setFormData])

  return (
    <FormDataProvider
      formData={formData}
      setFormData={setFormData}
      formSchema={schema}
      disableValidation={disableValidation || false}
      dataTransform={dataTransform}
      onValidation={onValidation}
    >
      <ErrorBoundary fallback={fallback} fieldSchema={schema} path={[]}>
        <FormElementRenderer
          components={components}
          fieldSchema={schema}
          path={[]}
          fallback={fallback}
          required={true}
          isArrayChild={false}
        />
      </ErrorBoundary>
    </FormDataProvider>
  )
}
