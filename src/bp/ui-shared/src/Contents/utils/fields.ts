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
  console.log(fields)

  return {}
}
