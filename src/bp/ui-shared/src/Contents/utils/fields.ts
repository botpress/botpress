import { FormData, FormField } from 'botpress/sdk'

export const createEmptyDataFromSchema = (fields: FormField[], lang?: string): FormData => {
  return fields.reduce((acc, field) => ({ ...acc, [field.key]: getFieldDefaultValue(field, lang) }), {})
}

export const getFieldDefaultValue = (field: Partial<FormField>, lang?: string) => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue
  }

  switch (field.type) {
    case 'hidden':
      return
    case 'checkbox':
      return false
    case 'group':
      if (!field.fields || !field.group?.minimum) {
        return []
      }

      return [createEmptyDataFromSchema(field.fields, lang)]
    case 'number':
      return
    case 'select':
      return null
    case 'text_array':
      return ['']
    case 'overridable':
    case 'text':
    case 'textarea':
    case 'upload':
    case 'url':
      return field.translated ? { [lang!]: '' } : ''
  }
}
