import { ContentType } from '.'
import utils from './_utils'
import ActionButton from './action_button'
import Carousel from './carousel'

export const cardSchema = {
  description: 'common.contentTypes.card.description',
  type: 'object',
  required: ['title'],
  properties: {
    title: {
      type: 'string',
      title: 'title'
    },
    subtitle: {
      type: 'string',
      title: 'subtitle'
    },
    image: {
      type: 'string',
      $subtype: 'image',
      $filter: '.jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*',
      title: 'image'
    },
    actions: {
      type: 'array',
      title: 'common.contentTypes.actionButton',
      items: ActionButton.jsonSchema
    }
  }
}

const contentType: ContentType = {
  id: 'builtin_card',
  group: 'Built-in Messages',
  title: 'card',
  jsonSchema: cardSchema,
  uiSchema: {},

  computePreviewText: formData => formData.title && `Card: ${formData.title}`,
  renderElement: (data, channel) => {
    // These channels now use channel renderers
    if (['telegram', 'twilio', 'slack', 'smooch', 'vonage', 'teams', 'messenger'].includes(channel)) {
      return utils.extractPayload('card', data)
    }

    return Carousel.renderElement({ items: [data], ...data }, channel)
  }
}

export default contentType
