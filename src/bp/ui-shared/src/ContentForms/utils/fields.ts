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
    case 'cards':
    case 'builtin_card':
      const advanced = isPartOfGroup ? {} : { markdown: true, typingIndicator: true }

      return {
        ...advanced,
        image: undefined,
        title: '',
        text: '',
        buttons: []
      }
    case 'builtin_carousel':
      return {
        markdown: true,
        typingIndicator: true,
        cards: [getEmptyFormData('builtin_card', true)]
      }
    case 'suggestions':
    case 'builtin_single-choice':
      if (isPartOfGroup) {
        return {
          label: '',
          value: ''
        }
      }
      return {
        onTopOfKeyboard: true,
        typingIndicator: true,
        canAdd: false,
        multiple: false,
        suggestions: [getEmptyFormData('builtin_single-choice', true)]
      }
    case 'buttons':
      return {
        buttonText: '',
        action: 'say'
      }
    default:
      return {}
  }
}
