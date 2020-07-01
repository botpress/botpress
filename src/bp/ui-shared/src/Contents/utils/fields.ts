import { FormData, FormField } from 'botpress/sdk'

export const createEmptyDataFromSchema = (fields: FormField[]): FormData => {
  return fields.reduce((acc, field) => ({ ...acc, [field.key]: getFieldDefaultValue(field) }), {})
}

export const getFieldDefaultValue = (field: Partial<FormField>) => {
  if (field.defaultValue) {
    return field.defaultValue
  }

  switch (field.type) {
    case 'checkbox':
      return false
    case 'group':
      if (!field.fields || !field.group?.minimum) {
        return []
      }

      return [createEmptyDataFromSchema(field.fields)]
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
      return field.translated ? {} : ''
  }
}
