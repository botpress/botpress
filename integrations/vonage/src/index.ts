import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import axios from 'axios'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => {
          const payload = { message_type: 'text', text: props.payload.text }
          await sendMessage(props, payload)
        },
        image: async (props) => {
          const payload = { message_type: 'image', image: { url: props.payload.imageUrl } }
          await sendMessage(props, payload)
        },
        markdown: async (props) => {
          const payload = { message_type: 'text', text: props.payload.markdown }
          await sendMessage(props, payload)
        },
        audio: async (props) => {
          const payload = { message_type: 'audio', audio: { url: props.payload.audioUrl } }
          await sendMessage(props, payload)
        },
        video: async (props) => {
          const payload = { message_type: 'video', video: { url: props.payload.videoUrl } }
          await sendMessage(props, payload)
        },
        file: async (props) => {
          const payload = { message_type: 'file', file: { url: props.payload.fileUrl } }
          await sendMessage(props, payload)
        },
        location: async (props) => {
          const payload = formatLocationPayload(props.payload)
          await sendMessage(props, payload)
        },
        carousel: async (props) => {
          const payloads = formatCarouselPayload(props.payload)
          for (const payload of payloads) {
            await sendMessage(props, payload)
          }
        },
        card: async (props) => {
          const payload = formatCardPayload(props.payload)
          await sendMessage(props, payload)
        },
        dropdown: async (props) => {
          const payload = formatDropdownPayload(props.payload)
          await sendMessage(props, payload)
        },
        choice: async (props) => {
          const payload = formatChoicePayload(props.payload)
          await sendMessage(props, payload)
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }

    const data = JSON.parse(req.body)

    console.info(`Handler received request of type ${data.message_type}`)

    if (data.message_type !== 'text') {
      throw new Error('Handler received an invalid message type')
    }

    if (data.channel !== 'whatsapp') {
      throw new Error('Handler received an invalid channel')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        channel: data.channel,
        channelId: data.to,
        userId: data.from,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        channel: data.channel,
        userId: data.from,
      },
    })

    await client.createMessage({
      tags: { id: data.message_uuid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: data.text },
    })
  },
  createUser: async ({ client, tags }) => {
    const vonageChannel = tags.channel
    const userId = tags.userId
    if (!(vonageChannel && userId)) {
      return
    }

    const { user } = await client.getOrCreateUser({
      tags: {
        channel: vonageChannel,
        userId,
      },
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags }) => {
    const vonageChannel = tags.channel
    const channelId = tags.channelId
    const userId = tags.userId

    if (!(vonageChannel && channelId && userId)) {
      return
    }

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: {
        channel: vonageChannel,
        channelId,
        userId,
      },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

function getRequestMetadata(conversation: SendMessageProps['conversation']) {
  const channel = conversation.tags?.channel
  const channelId = conversation.tags?.channelId
  const userId = conversation.tags?.userId

  if (!channelId) {
    throw new Error('Invalid channel id')
  }

  if (!userId) {
    throw new Error('Invalid user id')
  }

  if (!channel) {
    throw new Error('Invalid channel')
  }

  return { to: userId, from: channelId, channel }
}

type Dropdown = bp.channels.channel.dropdown.Dropdown
type Choice = bp.channels.channel.choice.Choice
type Carousel = bp.channels.channel.carousel.Carousel
type Card = bp.channels.channel.card.Card
type Location = bp.channels.channel.location.Location

function formatLocationPayload(payload: Location) {
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

function formatDropdownPayload(payload: Dropdown) {
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

function formatChoicePayload(payload: Choice) {
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

function formatCarouselPayload(payload: Carousel) {
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

function formatCardPayload(payload: Card, count: number = 0) {
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
type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>
async function sendMessage({ conversation, ctx, ack }: SendMessageProps, payload: any) {
  const { to, from, channel } = getRequestMetadata(conversation)
  const response = await axios.post(
    'https://api.nexmo.com/v1/messages',
    {
      ...payload,
      from,
      to,
      channel,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      auth: { username: ctx.configuration.apiKey, password: ctx.configuration.apiSecret },
    }
  )
  await ack({ tags: { id: response.data.message_uuid } })
}
