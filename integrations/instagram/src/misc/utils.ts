import {
  Card,
  Carousel,
  Choice,
  Dropdown,
  GenericTemplateElement,
  GenericTemplateMessage,
  InstagramAction,
  Location,
  TextMessageWithQuickReplies,
} from './types'

export function formatCardElement(payload: Card): GenericTemplateElement {
  const buttons: InstagramAction[] = []

  payload.actions.forEach((action) => {
    switch (action.action) {
      case 'postback':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `postback:${action.value}`,
        })
        break
      case 'say':
        buttons.push({
          type: 'postback',
          title: action.label,
          payload: `say:${action.value}`,
        })
        break
      case 'url':
        buttons.push({
          type: 'web_url',
          title: action.label,
          url: action.value,
        })
        break
      default:
        break
    }
  })
  return {
    title: payload.title,
    image_url: payload.imageUrl,
    subtitle: payload.subtitle,
    buttons,
  }
}

export function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

export function getCarouselMessage(payload: Carousel): GenericTemplateMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: payload.items.map(formatCardElement),
      },
    },
  }
}

export function getChoiceMessage(payload: Choice | Dropdown): TextMessageWithQuickReplies {
  if (!payload.options.length) {
    return { text: payload.text }
  }

  if (payload.options.length > 13) {
    return {
      text: `${payload.text}\n\n${payload.options.map((o) => `- ${o.label}`).join('\n')}`,
    }
  }

  return {
    text: payload.text,
    quick_replies: payload.options.map((option) => ({
      content_type: 'text',
      title: option.label,
      payload: option.value,
    })),
  }
}
