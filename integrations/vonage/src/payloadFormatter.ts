import * as bp from '.botpress'

export function formatLocationPayload(payload: bp.channels.channel.location.Location) {
  return {
    message_type: 'custom',
    custom: {
      type: 'location',
      location: {
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    },
  }
}

export function formatDropdownPayload(payload: bp.channels.channel.dropdown.Dropdown) {
  return {
    message_type: 'custom',
    custom: {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: payload.text,
        },
        action: {
          button: 'Select an option',
          sections: [
            {
              rows: payload.options.map((x, i) => ({ id: `slot-${i}::${x.value}`, title: x.label })),
            },
          ],
        },
      },
    },
  }
}

export function formatChoicePayload(payload: bp.channels.channel.choice.Choice) {
  if (payload.options.length < 3) {
    return {
      message_type: 'custom',
      custom: {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: payload.text,
          },
          action: {
            buttons: payload.options.map((x, i) => ({
              type: 'reply',
              reply: { id: `slot-${i}::${x.value}`, title: x.label },
            })),
          },
        },
      },
    }
  }

  if (payload.options.length <= 10) {
    return {
      message_type: 'custom',
      custom: {
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: payload.text,
          },
          action: {
            button: 'Select an option',
            sections: [
              {
                rows: payload.options.map((x, i) => ({ id: `slot-${i}::${x.value}`, title: x.label })),
              },
            ],
          },
        },
      },
    }
  }

  return {
    message_type: 'text',
    text: `${payload.text}\n\n${payload.options.map(({ label }, idx) => `*(${idx + 1})* ${label}`).join('\n')}`,
  }
}

export function formatCarouselPayload(payload: bp.channels.channel.carousel.Carousel) {
  let count = 0
  return payload.items.map((card) => {
    const cardPayload = formatCardPayload(card, count)
    count += card.actions.length
    return cardPayload
  })
}

type CardOption = CardSay | CardPostback | CardUrl

type CardSay = { title: string; type: 'say'; value: string }
type CardPostback = { title: string; type: 'postback'; value: string }
type CardUrl = { title: string; type: 'url' }

export function formatCardPayload(payload: bp.channels.channel.card.Card, count: number = 0) {
  const options: CardOption[] = []

  payload.actions.forEach((action) => {
    if (action.action === 'say') {
      options.push({ title: action.label, type: 'say', value: action.value })
    } else if (action.action === 'url') {
      options.push({ title: `${action.label} : ${action.value}`, type: 'url' })
    } else if (action.action === 'postback') {
      options.push({ title: action.label, type: 'postback', value: action.value })
    }
  })

  const body = `*${payload.title}*\n\n${payload.subtitle ? `${payload.subtitle}\n\n` : ''}${options
    .map(({ title }, idx) => `*(${idx + count + 1})* ${title}`)
    .join('\n')}`

  if (payload.imageUrl) {
    return {
      message_type: 'image',
      image: {
        url: payload.imageUrl,
        caption: body,
      },
    }
  }

  return { message_type: 'text', text: body }
}
