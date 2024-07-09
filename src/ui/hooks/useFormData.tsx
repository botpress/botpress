import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArraySchema, FormError, FormValidation, JSONSchema, Path } from '../types'
import { jsonSchemaToZui } from '../../transforms/json-schema-to-zui'
import { zuiKey } from '../constants'
import { Maskable } from '../../z'
import { pathMatches } from '../utils'

export type FormDataContextProps = {
  /**
   * The current form data
   * */
  formData: any
  formSchema: JSONSchema | any
  /**
   * Function to update the form data, takes a callback that receives the form data with the new values
   * */
  setFormData: (callback: (formData: any) => void) => void

  /**
   * hiddenState is an object that contains the hidden state of the form fields
   */
  hiddenState: object
  /**
   * Function to update the hidden state, takes a callback that receives the hidden state with the new values
   * */
  setHiddenState: (callback: (hiddenState: any) => void) => void
  /**
   * disabledState is an object that contains the disabled state of the form fields
   */
  disabledState: object
  /**
   * Function to update the disabled state, takes a callback that receives the disabled state with the new values
   * */
  setDisabledState: (callback: (disabledState: any) => void) => void

  /**
   * Validation state of the form
   */
  validation: FormValidation

  disableValidation?: boolean

  /**
   * Function to transform the form data before validation and computation of hidden/disabled states
   * useful for cases where the underlying form data does not match the schema
   */
  dataTransform?: (formData: any) => any

  onValidation?: (validation: FormValidation) => void
}

export type FormDataProviderProps = Omit<
  FormDataContextProps,
  'setHiddenState' | 'setDisabledState' | 'hiddenState' | 'disabledState' | 'validation'
>

export const FormDataContext = createContext<FormDataContextProps>({
  formData: undefined,
  formSchema: undefined,
  setFormData: () => {
    throw new Error('Must be within a FormDataProvider')
  },
  setHiddenState: () => {
    throw new Error('Must be within a FormDataProvider')
  },
  setDisabledState: () => {
    throw new Error('Must be within a FormDataProvider')
  },
  hiddenState: {},
  disabledState: {},
  validation: { formValid: null, formErrors: null },
})

const parseMaskableField = (key: 'hidden' | 'disabled', fieldSchema: JSONSchema, data: any): Maskable => {
  const value = fieldSchema[zuiKey]?.[key]
  if (typeof value === 'undefined') {
    return false
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (typeof window === 'undefined') {
      console.warn('Function evaluation is not supported in server side rendering')
      return false
    }
    const func = new Function('return ' + value)()
    const result = func(data)

    switch (typeof result) {
      case 'object':
      case 'boolean':
        return result
      default:
        return false
    }
  }
  return false
}

export const useFormData = (fieldSchema: JSONSchema, path: Path) => {
  const formContext = useContext(FormDataContext)
  if (formContext === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider')
  }

  const data = useMemo(() => getPathData(formContext.formData, path), [formContext.formData, path])

  const validation: FormValidation = useMemo(() => {
    if (formContext.validation.formValid === null) {
      return { formValid: null, formErrors: null }
    }
    if (formContext.validation.formValid === false) {
      return {
        formValid: false,
        formErrors:
          formContext.validation.formErrors
            ?.filter((issue) => pathMatches(issue.path, path))
            .map<FormError>((issue) => ({
              message: issue.message,
              code: issue.code,
              path: path,
            })) || null,
      }
    }
    return { formValid: true, formErrors: [] }
  }, [formContext.validation.formValid, formContext.validation.formErrors, path])

  const transformedData = formContext.dataTransform ? formContext.dataTransform(data) : data

  const hiddenMask = useMemo(
    () => parseMaskableField('hidden', fieldSchema, transformedData),
    [fieldSchema, transformedData],
  )
  const disabledMask = useMemo(
    () => parseMaskableField('disabled', fieldSchema, transformedData),
    [fieldSchema, transformedData],
  )

  useEffect(() => {
    formContext.setHiddenState((hiddenState) => setObjectPath(hiddenState, path, hiddenMask || {}))
    formContext.setDisabledState((disabledState) => setObjectPath(disabledState, path, disabledMask || {}))
  }, [JSON.stringify({ fieldSchema, data })])

  const { disabled, hidden } = useMemo(() => {
    const hidden = hiddenMask === true || getPathData(formContext.hiddenState, path)
    const disabled = disabledMask === true || getPathData(formContext.disabledState, path)
    return { hidden: hidden === true, disabled: disabled === true }
  }, [formContext.hiddenState, formContext.disabledState, hiddenMask, disabledMask, path])

  const handlePropertyChange = useCallback(
    (path: Path, data: any) => {
      formContext.setFormData((formData) => setObjectPath(formData, path, data))
    },
    [formContext.setFormData],
  )
  const addArrayItem = useCallback(
    (path: Path, data: any = undefined) => {
      const defaultData = getDefaultValues((fieldSchema as ArraySchema).items)

      formContext.setFormData((formData) => {
        const currentData = getPathData(formData, path) || []
        if (data === undefined) {
          data = defaultData
        }
        return setObjectPath(formData, path, Array.isArray(currentData) ? [...currentData, data] : [data])
      })
    },
    [formContext.setFormData],
  )

  const removeArrayItem = useCallback(
    (path: Path, index: number) => {
      formContext.setFormData((formData) => {
        const currentData = getPathData(formData, path) || []

        if (!Array.isArray(currentData)) {
          return formData
        }

        currentData.splice(index, 1)
        return setObjectPath(formData, path, currentData)
      })
    },
    [formContext.setFormData],
  )

  return { ...formContext, data, disabled, hidden, handlePropertyChange, addArrayItem, removeArrayItem, ...validation }
}

export function setObjectPath(obj: any, path: Path, data: any): any {
  if (path.length === 0) {
    return data
  }

  const pathLength = path.length

  path.reduce((current: any, key: string | number, index: number) => {
    if (index === pathLength - 1) {
      current[key] = data
    } else {
      if (!current[key]) {
        current[key] = isNaN(Number(key)) ? {} : []
      }
    }
    return current[key]
  }, obj ?? {})
  return { ...obj }
}

export const getDefaultValues = (schema: JSONSchema | JSONSchema[], optional?: boolean): any => {
  if (Array.isArray(schema)) {
    return getDefaultValues(schema[0]!)
  }

  if (schema.default) {
    return schema.default
  }

  if (schema.nullable) {
    return null
  }

  if (optional) {
    return undefined
  }

  if (schema.anyOf?.length) {
    return getDefaultValues(schema.anyOf[0]!)
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const data: Record<string, any> = {}
      Object.entries(schema.properties).map(([key, fieldSchema]) => {
        data[key] = getDefaultValues(fieldSchema, !schema.required?.includes(key) || isOptional(fieldSchema) || false)
      })
      return data
    }
  }

  if (schema.type === 'array') {
    if (schema.minItems && schema.minItems > 0) {
      return [getDefaultValues(schema.items)]
    }

    return []
  }

  if (schema.type === 'string') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return ''
  }

  if (schema.type === 'number') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return 0
  }

  if (schema.type === 'boolean') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return false
  }

  return undefined
}

export const FormDataProvider: React.FC<PropsWithChildren<FormDataProviderProps>> = ({
  children,
  setFormData,
  formData,
  formSchema,
  disableValidation,
  onValidation,
  dataTransform,
}) => {
  const [hiddenState, setHiddenState] = useState({})
  const [disabledState, setDisabledState] = useState({})

  const transformedData = dataTransform ? dataTransform(formData) : formData

  const validation: FormValidation = useMemo(() => {
    if (disableValidation) {
      return { formValid: null, formErrors: null }
    }

    if (!formSchema) {
      return { formValid: null, formErrors: null }
    }

    const validation = jsonSchemaToZui(formSchema).safeParse(transformedData)

    if (!validation.success) {
      return {
        formValid: false,
        formErrors: validation.error.issues,
      }
    }
    return {
      formValid: true,
      formErrors: [],
    }
  }, [JSON.stringify({ transformedData })])

  useEffect(() => {
    if (onValidation) {
      onValidation(validation)
    }
  }, [validation])

  return (
    <FormDataContext.Provider
      value={{
        formData,
        setFormData,
        formSchema,
        validation,
        hiddenState,
        setHiddenState,
        disabledState,
        setDisabledState,
        dataTransform,
      }}
    >
      {children}
    </FormDataContext.Provider>
  )
}

export function getPathData(object: any, path: Path): any {
  return path.reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, object)
}

export function isOptional(schema: JSONSchema): boolean {
  return schema.anyOf?.some((s) => s.not && Object.keys(s.not).length === 0) || false
}

type AnyObject = { [key: string]: any }

export function deepMerge(target: AnyObject, source: AnyObject): AnyObject {
  const output = { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        if (typeof output[key] === 'object' && output[key] !== null && !Array.isArray(output[key])) {
          output[key] = deepMerge(output[key], source[key])
        } else {
          output[key] = deepMerge({}, source[key])
        }
      } else {
        output[key] = source[key]
      }
    }
  }

  return output
}
