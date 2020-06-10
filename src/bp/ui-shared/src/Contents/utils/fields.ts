import { FormData } from 'common/typings'

export const getEmptyFormData = (contentType: string, isPartOfGroup = false): FormData => {
  switch (contentType) {
    case 'image':
      return {
        markdown: true,
        typingIndicator: true,
        image: undefined,
        title: ''
      }
    case 'text':
      return {
        markdown: true,
        typingIndicator: true,
        text: '',
        variations: []
      }
    case 'card':
      const advanced = isPartOfGroup ? {} : { markdown: true, typingIndicator: true }

      return {
        ...advanced,
        image: undefined,
        title: '',
        subtitle: '',
        items: []
      }
    case 'carousel':
      return {
        markdown: true,
        typingIndicator: true,
        items: [getEmptyFormData('card', true)]
      }
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
        choices: [getEmptyFormData('suggestions', true)]
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
