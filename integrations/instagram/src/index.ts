import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import queryString from 'query-string'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

const idTag = 'instagram:id'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendText(recipientId, payload.text)),
        image: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendImage(recipientId, payload.imageUrl)),
        markdown: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendText(recipientId, payload.markdown)),
        audio: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendAudio(recipientId, payload.audioUrl)),
        video: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendVideo(recipientId, payload.videoUrl)),
        file: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => instagram.sendFile(recipientId, payload.fileUrl)),
        location: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) =>
            instagram.sendText(recipientId, formatGoogleMapLink(payload))
          ),
        carousel: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) =>
            instagram.sendMessage(recipientId, getCarouselMessage(payload))
          ),
        card: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) =>
            instagram.sendMessage(recipientId, getCarouselMessage({ items: [payload] }))
          ),
        dropdown: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) =>
            instagram.sendMessage(recipientId, getChoiceMessage(payload))
          ),
        choice: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) =>
            instagram.sendMessage(recipientId, getChoiceMessage(payload))
          ),
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    console.info('Handler received request')

    if (req.query) {
      const query = queryString.parse(req.query)

      const mode = query['hub.mode']
      const token = query['hub.verify_token']
      const challenge = query['hub.challenge']

      if (mode === 'subscribe' && token === ctx.configuration.verifyToken) {
        if (!challenge) {
          return {
            status: 400,
          }
        }

        return {
          body: typeof challenge === 'string' ? challenge : '',
        }
      } else {
        return {
          status: 403,
        }
      }
    }

    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }

    const data = JSON.parse(req.body) as InstagramPayload

    for (const { messaging } of data.entry) {
      for (const message of messaging) {
        await handleMessage(message, client)
      }
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags[idTag]

    if (!userId) {
      return
    }

    const messengerClient = new MessengerClient({ accessToken: ctx.configuration.accessToken })
    const profile = await messengerClient.getUserProfile(userId)

    const { user } = await client.getOrCreateUser({ tags: { [idTag]: `${profile.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const userId = tags[idTag]

    if (!userId) {
      return
    }

    const messengerClient = new MessengerClient({ accessToken: ctx.configuration.accessToken })
    const profile = await messengerClient.getUserProfile(userId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { [idTag]: `${profile.id}` },
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

type Carousel = bp.channels.channel.carousel.Carousel
type Card = bp.channels.channel.card.Card
type Choice = bp.channels.channel.choice.Choice
type Dropdown = bp.channels.channel.dropdown.Dropdown
type Location = bp.channels.channel.location.Location

type InstagramAttachment = InstagramPostbackAttachment | InstagramSayAttachment | InstagramUrlAttachment

type InstagramPostbackAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type InstagramSayAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type InstagramUrlAttachment = {
  type: 'web_url'
  title: string
  url: string
}

function formatCardElement(payload: Card) {
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

function getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
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

function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.AttachmentMessage {
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

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack'>

async function sendMessage(
  { ack, ctx, conversation }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
  const messengerClient = new MessengerClient({ accessToken: ctx.configuration.accessToken })
  const recipientId = getRecipientId(conversation)
  await send(messengerClient, recipientId)
  await ack({
    tags: {
      // TODO: declare in definition
      // [idTag]: messageId,
    },
  })
}

export function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags[idTag]

  if (!recipientId) {
    throw Error(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}

async function handleMessage(message: InstagramMessage, client: bp.Client) {
  if (message.message) {
    if (message.message.text) {
      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          [idTag]: message.sender.id,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          [idTag]: message.sender.id,
        },
      })

      await client.createMessage({
        type: 'text',
        tags: {
          // TODO: declare in definition
          // [idTag]: message.message.mid
        },
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: message.message.text },
      })
    }
  }
}

function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

type InstagramPayload = {
  object: string
  entry: InstagramEntry[]
}

type InstagramEntry = {
  id: string
  time: number
  messaging: InstagramMessage[]
}

type InstagramMessage = {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: {
    mid: string
    text: string
    quick_reply?: { payload: string }
    attachments?: { type: string; payload: { url: string } }[]
  }
  postback?: {
    mid: string
    payload: string
    title: string
  }
}
