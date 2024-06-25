import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import React from 'react'
import { ArraySchema, JSONSchema } from '../types'
import { jsonSchemaToZui } from '../../transforms/json-schema-to-zui'
import { zuiKey } from '../constants'
import { Maskable } from '../../z'

export type FormDataContextProps = {
  formData: any
  formSchema: JSONSchema | any
  setFormData: (callback: (formData: any) => void) => void
  setHiddenState: (callback: (hiddenState: any) => void) => void
  setDisabledState: (callback: (disabledState: any) => void) => void
  hiddenState: object
  disabledState: object
  disableValidation: boolean
}
export type FormDataProviderProps = Omit<
  FormDataContextProps,
  'setHiddenState' | 'setDisabledState' | 'hiddenState' | 'disabledState'
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
  disableValidation: false,
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

export const useFormData = (fieldSchema: JSONSchema, path: string[]) => {
  const formContext = useContext(FormDataContext)
  if (formContext === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider')
  }

  const data = useMemo(() => getPathData(formContext.formData, path), [formContext.formData, path])

  const validation = useMemo(() => {
    if (formContext.disableValidation) {
      return { formValid: null, formErrors: null }
    }

    if (!formContext.formSchema) {
      return { formValid: null, formErrors: null }
    }

    const validation = jsonSchemaToZui(formContext.formSchema).safeParse(formContext.formData)

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
  }, [formContext.formData])

  const hiddenMask = useMemo(() => parseMaskableField('hidden', fieldSchema, data), [fieldSchema, data])
  const disabledMask = useMemo(() => parseMaskableField('disabled', fieldSchema, data), [fieldSchema, data])

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
    (path: string[], data: any) => {
      formContext.setFormData((formData) => setObjectPath(formData, path, data))
    },
    [formContext.setFormData],
  )
  const addArrayItem = useCallback(
    (path: string[], data: any = undefined) => {
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
    (path: string[], index: number) => {
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

export function setObjectPath(obj: any, path: string[], data: any): any {
  if (path.length === 0) {
    return data
  }

  const pathLength = path.length

  path.reduce((current: any, key: string, index: number) => {
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
}) => {
  const [hiddenState, setHiddenState] = useState({})
  const [disabledState, setDisabledState] = useState({})

  return (
    <FormDataContext.Provider
      value={{
        formData,
        setFormData,
        formSchema,
        disableValidation,
        hiddenState,
        setHiddenState,
        disabledState,
        setDisabledState,
      }}
    >
      {children}
    </FormDataContext.Provider>
  )
}

export function getPathData(object: any, path: string[]): any {
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
