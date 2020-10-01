import { FormData, FormField } from 'botpress/sdk'

import { lang as langTr } from '../../translations'

export const createEmptyDataFromSchema = (fields: FormField[], lang?: string): FormData => {
  return fields.reduce((acc, field) => ({ ...acc, [field.key]: getFieldDefaultValue(field, lang) }), {})
}

export const getFieldDefaultValue = (field: Partial<FormField>, lang?: string) => {
  if (field.defaultValue !== undefined) {
    return typeof field.defaultValue === 'string' ? langTr(field.defaultValue) : field.defaultValue
  }

  switch (field.type) {
    case 'hidden':
      return
    case 'checkbox':
      return false
    case 'group':
      if (!field.fields || (!field.group?.minimum && !field.group?.defaultItem)) {
        return []
      }

      return [createEmptyDataFromSchema(field.fields, lang)]
    case 'number':
      return
    case 'select':
      return null
    case 'text_array':
      const items = field.group?.minimum ?? 1 > 0 ? [''] : []
      return field.translated ? { [lang!]: items } : items
    case 'overridable':
    case 'text':
    case 'textarea':
    case 'upload':
    case 'url':
      return field.translated ? { [lang!]: '' } : ''
  }
}
