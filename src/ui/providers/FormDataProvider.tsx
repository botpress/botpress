import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import React from 'react'
import { JSONSchema } from '../types'
import { jsonSchemaToZui } from '../../json-schema/json-schema-to-zui'
import { ZodAny } from 'zod'

export type FormFieldContextProps = {
  formData: any
  formSchema: JSONSchema | any
  setFormData: (data: any) => void
  disableValidation: boolean
}

export const FormDataContext = createContext<FormFieldContextProps>({
  formData: undefined,
  formSchema: undefined,
  setFormData: () => {
    throw new Error('Must be within a FormDataProvider')
  },
  disableValidation: false,
})

export const useFormData = () => {
  const context = useContext(FormDataContext)
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider')
  }
  const zodSchema = useMemo(() => {
    try {
      return jsonSchemaToZui(context.formSchema) as any as ZodAny
    } catch (e) {
      console.error('Error transforming zod schema to zui schema', e)
      return null
    }
  }, [context.formSchema])

  const validation = useMemo(() => {
    if (context.disableValidation) {
      return { formValid: null, formErrors: null }
    }

    if (!zodSchema) {
      return { formValid: null, formErrors: null }
    }

    const validation = zodSchema.safeParse(context.formData)

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
  }, [zodSchema, context.formData])

  const handlePropertyChange = (path: string, data: any) => {
    context.setFormData(setObjectPath(context.formData, path, data))
  }

  const addArrayItem = (path: string, data: any) => {
    const currentData = getPathData(context.formData, path.split('.')) || []
    context.setFormData(setObjectPath(context.formData, path, [...currentData, data]))
  }

  const removeArrayItem = (path: string, index: number) => {
    const currentData = getPathData(context.formData, path.split('.'))
    currentData.splice(index, 1)
    context.setFormData(setObjectPath(context.formData, path, currentData))
  }

  return { ...context, handlePropertyChange, addArrayItem, removeArrayItem, ...validation }
}

export function setObjectPath(obj: any, path: string, data: any): any {
  const pathArray = path.split('.')
  const pathArrayLength = pathArray.length
  pathArray.reduce((current: any, key: string, index: number) => {
    if (index === pathArrayLength - 1) {
      current[key] = data
    } else {
      if (!current[key]) {
        current[key] = isNaN(Number(key)) ? {} : []
      }
    }
    return current[key]
  }, obj)
  return { ...obj }
}

export const getDefaultItemData = (schema: JSONSchema): any => {
  if (schema.type === 'object') {
    return {}
  }
  if (schema.type === 'array') {
    return []
  }
  if (schema.type === 'string') {
    return ''
  }
  if (schema.type === 'number') {
    return 0
  }
  if (schema.type === 'boolean') {
    return false
  }
  return null
}

export const FormDataProvider: React.FC<PropsWithChildren<FormFieldContextProps>> = ({
  children,
  setFormData,
  formData,
  formSchema,
  disableValidation,
}) => {
  return (
    <FormDataContext.Provider value={{ formData, setFormData, formSchema, disableValidation }}>
      {children}
    </FormDataContext.Provider>
  )
}

export function getPathData(object: any, path: string[]): any {
  return path.reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, object)
}
