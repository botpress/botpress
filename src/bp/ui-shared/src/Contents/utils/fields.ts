import { FormData, FormField } from 'botpress/sdk'

export const getEmptyFormData = (contentType: string, isPartOfGroup = false): FormData => {
  switch (contentType) {
    case 'builtin_image':
      return {
        markdown: true,
        typing: true,
        image: undefined,
        title: ''
      }
    case 'builtin_text':
      return {
        markdown: true,
        typing: true,
        text: '',
        variations: []
      }
    case 'card':
    case 'builtin_card':
      const advanced = isPartOfGroup ? {} : { markdown: true, typing: true }

      return {
        ...advanced,
        image: undefined,
        title: '',
        subtitle: '',
        items: []
      }
    case 'builtin_carousel':
      return {
        markdown: true,
        typing: true,
        items: [getEmptyFormData('builtin_card', true)]
      }
    case 'builtin_single-choice':
    case 'suggestions':
      if (isPartOfGroup) {
        return {
          title: '',
          value: ''
        }
      }
      return {
        onTopOfKeyboard: true,
        typing: true,
        canAdd: false,
        multiple: false,
        choices: [getEmptyFormData('builtin_single-choice', true)]
      }
    case 'buttons':
      return {
        title: '',
        action: '',
        actionSelect: 'say'
      }
    case 'variations':
      return { item: '' }
    default:
      return {}
  }
}

export const createEmptyDataFromSchema = (fields: FormField[]): FormData => {
  const emptyData = fields.reduce(emptyDataReducer, {})

  return emptyData
}

const emptyDataReducer = (emptyData: FormData, field: FormField): FormData => {
  return { ...emptyData, [field.key]: getFieldDefaultValue(field) }
}

const getFieldDefaultValue = (field: FormField) => {
  if (field.defaultValue) {
    return field.defaultValue
  }

  switch (field.type) {
    case 'checkbox':
      return false
    case 'group':
      return [field.fields?.reduce(emptyDataReducer, {})]
    case 'number':
      return 0
    case 'select':
      return null
    case 'text_array':
      return ['']
    case 'overridable':
    case 'text':
    case 'textarea':
    case 'upload':
    case 'url':
      return ''
  }
}
