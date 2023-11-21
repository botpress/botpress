import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import { Card, Carousel, Choice, Dropdown, InstagramAttachment, Location } from './types'
import * as bp from '.botpress'

export function getMessengerClient(configuration: bp.configuration.Configuration) {
  return new MessengerClient({
    accessToken: configuration.accessToken,
  })
}

export function formatCardElement(payload: Card) {
  const buttons: InstagramAttachment[] = []

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

export function getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        templateType: 'generic',
        elements: payload.items.map(formatCardElement),
      },
    },
  }
}

export function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.AttachmentMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        templateType: 'generic',
      },
    },
    quickReplies: payload.options.map((choice) => ({
      contentType: 'text',
      title: choice.label,
      payload: choice.value,
    })),
  }
}
