import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import axios from 'axios'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ webhookUrl, ctx }) => {
    await setViberWebhook(webhookUrl, ctx.configuration.authToken)
  },
  unregister: async ({ ctx }) => {
    await setViberWebhook(undefined, ctx.configuration.authToken)
  },
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'text',
              text: props.payload.text,
            },
          })
        },
        image: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'picture',
              text: '',
              media: props.payload.imageUrl,
            },
          })
        },
        markdown: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'text',
              text: props.payload.markdown,
            },
          })
        },
        audio: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'url',
              media: props.payload.audioUrl,
            },
          })
        },
        video: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'video',
              media: props.payload.videoUrl,
              size: 26214390, // TODO: get video size
            },
          })
        },
        file: async (props) => {
          const name = props.payload.fileUrl.split('/')
          await sendViberMessage({
            ...props,
            payload: {
              type: 'file',
              media: props.payload.fileUrl,
              size: 1000, // TODO: get file size
              file_name: name[name.length - 1],
            },
          })
        },
        location: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'location',
              location: {
                lat: props.payload.latitude,
                lon: props.payload.longitude,
              },
            },
          })
        },
        carousel: async (props) => {
          const carrousel = props.payload.items.flatMap(renderCard)

          await sendViberMessage({
            ...props,
            payload: {
              type: 'rich_media',
              rich_media: {
                Type: 'rich_media',
                ButtonsGroupColumns: 6,
                ButtonsGroupRows: 7,
                BgColor: '#FFFFFF',
                Buttons: carrousel,
              },
            },
          })
        },
        card: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'rich_media',
              rich_media: {
                Type: 'rich_media',
                ButtonsGroupColumns: 6,
                ButtonsGroupRows: 7,
                BgColor: '#FFFFFF',
                Buttons: renderCard(props.payload),
              },
            },
          })
        },
        dropdown: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'rich_media',
              rich_media: {
                Type: 'rich_media',
                ButtonsGroupColumns: 6,
                ButtonsGroupRows: 5,
                BgColor: '#FFFFFF',
                Buttons: renderChoice(props.payload),
              },
            },
          })
        },
        choice: async (props) => {
          await sendViberMessage({
            ...props,
            payload: {
              type: 'rich_media',
              rich_media: {
                Type: 'rich_media',
                ButtonsGroupColumns: 6,
                ButtonsGroupRows: 5,
                BgColor: '#FFFFFF',
                Buttons: renderChoice(props.payload),
              },
            },
          })
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

    if (data.event.bot_id) {
      return
    }

    if (data.event === 'message') {
      if (!data.sender) {
        throw Error('Sender information unavailable')
      }

      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          id: data.sender.id,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: data.sender.id,
        },
      })

      switch (data.message.type) {
        case 'text':
          await client.createMessage({
            tags: { id: data.message_token.toString() },
            type: 'text',
            userId: user.id,
            conversationId: conversation.id,
            payload: { text: data.message.text },
          })
          break
        case 'picture':
          await client.createMessage({
            tags: { id: data.message_token.toString() },
            type: 'image',
            userId: user.id,
            conversationId: conversation.id,
            payload: {
              imageUrl: data.message.media,
              // TODO: declare in definition
              // caption: '',
            },
          })
          break
        case 'video':
          await client.createMessage({
            tags: { id: data.message_token.toString() },
            type: 'video',
            userId: user.id,
            conversationId: conversation.id,
            payload: {
              videoUrl: data.message.media,
              // TODO: declare in definition
              // size: data.message.size
            },
          })
          break
        case 'file':
          await client.createMessage({
            tags: { id: data.message_token.toString() },
            type: 'file',
            userId: user.id,
            conversationId: conversation.id,
            payload: {
              fileUrl: data.message.media,
              // TODO: declare in definition
              // fileName: data.message.file_name,
              // fileSize: data.message.size,
            },
          })
          break
        case 'location':
          await client.createMessage({
            tags: { id: data.message_token.toString() },
            type: 'location',
            userId: user.id,
            conversationId: conversation.id,
            payload: { latitude: data.message.location.lat, longitude: data.message.location.lon },
          })
          break
        default:
          console.info('unsupported message type: ', data.message)
          return
      }
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const userDetails = await getUserDetails({ ctx, id: userId })

    const { user } = await client.getOrCreateUser({ tags: { id: `${userDetails.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const userDetails = await getUserDetails({ ctx, id: userId })

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: `${userDetails.id}` },
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

type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'> & {
  payload: any // TODO: type this
}

export async function setViberWebhook(webhookUrl: string | undefined, token: string): Promise<void> {
  await axios.post(
    'https://chatapi.viber.com/pa/set_webhook',
    {
      url: webhookUrl,
      send_name: true,
    },
    {
      headers: {
        'X-Viber-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    }
  )
}

export async function sendViberMessage({ conversation, ctx, ack, payload }: SendMessageProps) {
  const target = conversation.tags.id
  const { data } = await axios.post(
    'https://chatapi.viber.com/pa/send_message',
    {
      ...payload,
      receiver: target,
      min_api_version: 2,
      sender: {
        name: ctx.configuration.botName,
        avatar: ctx.configuration.botAvatar,
      },
    },
    {
      headers: {
        'X-Viber-Auth-Token': ctx.configuration.authToken,
        'Content-Type': 'application/json',
      },
    }
  )
  if (!data) {
    throw Error('Error sending Viber message')
  }

  if (!data.message_token) {
    throw Error(data.status_message)
  }
  await ack({
    tags: {
      id: data.message_token.toString(),
    },
  })
  return data
}

async function getUserDetails({ ctx, id }: { ctx: bp.Context; id: string }) {
  const { data } = await axios.post(
    'https://chatapi.viber.com/pa/get_user_details',
    { id },
    {
      headers: {
        'X-Viber-Auth-Token': ctx.configuration.authToken,
        'Content-Type': 'application/json',
      },
    }
  )
  if (!data) {
    throw Error('Error checking user details message')
  }

  if (!data.message_token) {
    throw Error(data.status_message)
  }
  return data.user
}

type Card = bp.channels.channel.card.Card
type CardAction = bp.channels.channel.card.Card['actions'][number]

const renderCard = (payload: Card) => {
  const card = [
    {
      Columns: 6,
      Rows: 3,
      ActionType: 'open-url',
      ActionBody: '',
      Image: payload.imageUrl,
    },
    {
      Columns: 6,
      Rows: 1,
      ActionType: 'open-url',
      ActionBody: '',
      Text: `<font color=#323232><b>${payload.title}</b></font><font color=#777777><br>${payload.subtitle}</font>`,
      TextSize: 'medium',
      TextVAlign: 'middle',
      TextHAlign: 'left',
    },
  ]
  payload.actions.forEach((item) => {
    switch (item.action) {
      case 'say':
        card.push(renderButtonSay(item))
        return
      case 'postback':
        return card.push(renderButtonPostback(item))
      case 'url':
        return card.push(renderButtonUrl(item))
      default:
        throw Error(`Unknown action type ${item.action}`)
    }
  })
  return card
}

function renderButtonUrl(action: CardAction) {
  return {
    Columns: 6,
    Rows: 1,
    ActionType: 'open-url',
    ActionBody: action.value,
    Text: `<font color=#8367db>${action.label}</font>`,
    TextSize: 'small',
    TextVAlign: 'middle',
    TextHAlign: 'middle',
  }
}

function renderButtonPostback(action: CardAction) {
  return {
    Columns: 6,
    Rows: 1,
    ActionType: 'reply',
    ActionBody: action.value,
    Text: `<font color=#8367db>${action.label}</font>`,
    TextSize: 'small',
    TextVAlign: 'middle',
    TextHAlign: 'middle',
  }
}

function renderButtonSay(action: CardAction) {
  return {
    Columns: 6,
    Rows: 1,
    ActionType: 'reply',
    ActionBody: action.value,
    Text: `<font color=#8367db>${action.label}</font>`,
    TextSize: 'small',
    TextVAlign: 'middle',
    TextHAlign: 'middle',
  }
}

type Choice = bp.channels.channel.choice.Choice

function renderChoice(payload: Choice) {
  const choice = [
    {
      Columns: 6,
      Rows: 2,
      ActionType: 'open-url',
      ActionBody: '',
      Text: `<font color=#323232><b>${payload.text}</b></font>`,
      TextSize: 'medium',
      TextVAlign: 'middle',
      TextHAlign: 'left',
    },
  ]
  payload.options.forEach((c) => {
    choice.push({
      Columns: 6,
      Rows: 1,
      ActionType: 'reply',
      ActionBody: c.value,
      Text: `<font color=#8367db>${c.label}</font>`,
      TextSize: 'small',
      TextVAlign: 'middle',
      TextHAlign: 'middle',
    })
  })
  return choice
}
