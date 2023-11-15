import { IntegrationContext } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import queryString from 'query-string'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]
type IntegrationLogger = Parameters<bp.IntegrationProps['handler']>[0]['logger']

const idTag = 'messenger:id'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendText(recipientId, payload.text)),
        image: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendImage(recipientId, payload.imageUrl)),
        markdown: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendText(recipientId, payload.markdown)),
        audio: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendAudio(recipientId, payload.audioUrl)),
        video: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendVideo(recipientId, payload.videoUrl)),
        file: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => messenger.sendFile(recipientId, payload.fileUrl)),
        location: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) =>
            messenger.sendText(recipientId, formatGoogleMapLink(payload))
          ),
        carousel: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) =>
            messenger.sendMessage(recipientId, getCarouselMessage(payload))
          ),
        card: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) =>
            messenger.sendMessage(recipientId, getCarouselMessage({ items: [payload] }))
          ),
        dropdown: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) =>
            messenger.sendMessage(recipientId, getChoiceMessage(payload))
          ),
        choice: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) =>
            messenger.sendMessage(recipientId, getChoiceMessage(payload))
          ),
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
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

    const data = JSON.parse(req.body) as MessengerPayload

    for (const { messaging } of data.entry) {
      for (const message of messaging) {
        await handleMessage(message, { client, ctx, logger })
      }
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags[idTag]

    if (!userId) {
      return
    }

    const messengerClient = getMessengerClient(ctx.configuration)
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

    const messengerClient = getMessengerClient(ctx.configuration)
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

type MessengerAttachment = MessengerPostbackAttachment | MessengerSayAttachment | MessengerUrlAttachment

type MessengerPostbackAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerSayAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerUrlAttachment = {
  type: 'web_url'
  title: string
  url: string
}

function formatCardElement(payload: Card) {
  const buttons: MessengerAttachment[] = []

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

function getMessengerClient(ctx: bp.configuration.Configuration) {
  return new MessengerClient({
    accessToken: ctx.accessToken,
    appSecret: ctx.appSecret,
    appId: ctx.appId,
  })
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

function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.TextMessage {
  if (!payload.options.length) {
    return { text: payload.text }
  }

  if (payload.options.length > 13) {
    return {
      text: `${payload.text}\n\n${payload.options.map((o, idx) => `${idx + 1}. ${o.label}`).join('\n')}`,
    }
  }

  return {
    text: payload.text,
    quickReplies: payload.options.map((option) => ({
      contentType: 'text',
      title: option.label,
      payload: option.value,
    })),
  }
}

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack'>

async function sendMessage(
  { ack, ctx, conversation }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
  const messengerClient = getMessengerClient(ctx.configuration)
  const recipientId = getRecipientId(conversation)
  const { messageId } = await send(messengerClient, recipientId)
  await ack({ tags: { [idTag]: messageId } })
}

export function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags[idTag]

  if (!recipientId) {
    throw Error(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}

async function handleMessage(
  message: MessengerMessage,
  {
    client,
    ctx,
    logger,
  }: { client: bp.Client; ctx: IntegrationContext<bp.configuration.Configuration>; logger: IntegrationLogger }
) {
  if (message?.message?.text) {
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

    // TODO: do this for profile_pic as well, as of 13 NOV 2023 the url "https://platform-lookaside.fbsbx.com/platform/profilepic?eai=<eai>&psid=<psid>&width=<width>&ext=<ext>&hash=<hash>" is not working
    if (!user.name) {
      logger.forBot().info('The user does not have a name, fetching from Messenger')
      try {
        const messengerClient = getMessengerClient(ctx.configuration)
        const profile = await messengerClient.getUserProfile(message.sender.id)

        await client.updateUser({ ...user, name: profile.name })
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Messenger:', error)
      }
    }

    await client.createMessage({
      tags: { [idTag]: message.message.mid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: message.message.text },
    })
  }
}

function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

type MessengerPayload = {
  object: string
  entry: MessengerEntry[]
}

type MessengerEntry = {
  id: string
  time: number
  messaging: MessengerMessage[]
}

type MessengerMessage = {
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
