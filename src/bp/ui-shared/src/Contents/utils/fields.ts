import { FormData } from 'common/typings'

export const getEmptyFormData = (contentType: string, isPartOfGroup = false): FormData => {
  switch (contentType) {
    case 'builtin_image':
      return {
        markdown: true,
        typingIndicator: true,
        image: undefined,
        title: ''
      }
    case 'builtin_text':
      return {
        markdown: true,
        typingIndicator: true,
        text: '',
        variations: []
      }
    case 'card':
    case 'builtin_card':
      const advanced = isPartOfGroup ? {} : { markdown: true, typingIndicator: true }

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
        typingIndicator: true,
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
        typingIndicator: true,
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
