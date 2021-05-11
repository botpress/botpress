import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { MessengerContext } from '../backend/typings'

export class MessengerCarouselRenderer implements ChannelRenderer<MessengerContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return MessengerCarouselRenderer.name
  }

  handles(context: MessengerContext): boolean {
    return !!context.payload.items?.length
  }

  render(context: MessengerContext) {
    const renderElements = data => {
      if (data.items.find(({ actions }) => !actions || actions.length === 0)) {
        throw new Error('Channel-Messenger carousel does not support cards without actions')
      }

      return data.items.map(card => ({
        title: card.title,
        image_url: card.image ? formatUrl(context.botUrl, card.image) : null,
        subtitle: card.subtitle,
        buttons: (card.actions || []).map(a => {
          if (a.action === 'Say something') {
            throw new Error('Channel-Messenger carousel does not support "Say something" action-buttons at the moment')
          } else if (a.action === 'Open URL') {
            return {
              type: 'web_url',
              url: a.url,
              title: a.title
            }
          } else if (a.action === 'Postback') {
            return {
              type: 'postback',
              title: a.title,
              payload: a.payload
            }
          } else {
            throw new Error(`Channel-Messenger carousel does not support "${a.action}" action-buttons at the moment`)
          }
        })
      }))
    }

    context.messages.push({
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: renderElements(context.payload)
        }
      }
    })
  }
}
