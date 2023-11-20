import { IntegrationContext } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { MessengerClient, MessengerTypes } from 'messaging-api-messenger'
import queryString from 'query-string'
import { idTag } from './const'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]
type IntegrationLogger = Parameters<bp.IntegrationProps['handler']>[0]['logger']
type InstagramUserProfile = MessengerTypes.User & { username: string }

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending text message from bot to Instagram:', payload.text)
            return instagram.sendText(recipientId, payload.text)
          }),
        image: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending image message from bot to Instagram:', payload.imageUrl)
            return instagram.sendImage(recipientId, payload.imageUrl)
          }),
        markdown: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending markdown message from bot to Instagram:', payload.markdown)
            return instagram.sendText(recipientId, payload.markdown)
          }),
        audio: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending audio message from bot to Instagram:', payload.audioUrl)
            return instagram.sendAudio(recipientId, payload.audioUrl)
          }),
        video: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending video message from bot to Instagram:', payload.videoUrl)
            return instagram.sendVideo(recipientId, payload.videoUrl)
          }),
        file: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            props.logger.forBot().debug('Sending file message from bot to Instagram:', payload.fileUrl)
            return instagram.sendFile(recipientId, payload.fileUrl)
          }),
        location: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            const googleMapLink = formatGoogleMapLink(payload)

            props.logger.forBot().debug('Sending location message from bot to Instagram:', googleMapLink)
            return instagram.sendText(recipientId, googleMapLink)
          }),
        carousel: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            const carouselMessage = getCarouselMessage(payload)

            props.logger.forBot().debug('Sending carousel message from bot to Instagram:', carouselMessage)
            return instagram.sendMessage(recipientId, getCarouselMessage(payload))
          }),
        card: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            const cardMessage = getCarouselMessage({ items: [payload] })

            props.logger.forBot().debug('Sending card message from bot to Instagram:', cardMessage)
            return instagram.sendMessage(recipientId, cardMessage)
          }),
        dropdown: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            const choiceMessage = getChoiceMessage(payload)

            props.logger.forBot().debug('Sending dropdown message from bot to Instagram:', choiceMessage)
            return instagram.sendMessage(recipientId, choiceMessage)
          }),
        choice: async ({ payload, ...props }) =>
          sendMessage(props, async (instagram, recipientId) => {
            const choiceMessage = getChoiceMessage(payload)

            props.logger.forBot().debug('Sending choice message from bot to Instagram:', choiceMessage)
            return instagram.sendMessage(recipientId, getChoiceMessage(payload))
          }),
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    logger.forBot().debug('Handler received request from Instagram with payload:', req.body)

    if (req.query) {
      const query = queryString.parse(req.query)

      const mode = query['hub.mode']
      const token = query['hub.verify_token']
      const challenge = query['hub.challenge']

      if (mode === 'subscribe') {
        if (token === ctx.configuration.verifyToken) {
          if (!challenge) {
            logger.forBot().warn('Returning HTTP 400 as no challenge parameter was received in query string of request')
            return {
              status: 400,
            }
          }

          return {
            body: typeof challenge === 'string' ? challenge : '',
          }
        } else {
          logger
            .forBot()
            .warn("Returning HTTP 403 as the Instagram token doesn't match the one in the bot configuration")
          return {
            status: 403,
          }
        }
      } else {
        logger.forBot().warn(`Returning HTTP 400 as the '${mode}' mode received in the query string isn't supported`)
        return {
          status: 400,
        }
      }
    }

    if (!req.body) {
      logger.forBot().warn('Handler received an empty body, so the message was ignored')
      return
    }

    try {
      const data = JSON.parse(req.body) as InstagramPayload

      for (const { messaging } of data.entry) {
        for (const message of messaging) {
          await handleMessage(message, { client, ctx, logger })
        }
      }
    } catch (e: any) {
      logger.forBot().error('Error while handling request:', e)
      logger.forBot().debug('Request body received:', req.body)
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

function getMessengerClient(configuration: bp.configuration.Configuration) {
  return new MessengerClient({
    accessToken: configuration.accessToken,
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
  const messengerClient = getMessengerClient(ctx.configuration)
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

async function handleMessage(
  message: InstagramMessage,
  {
    client,
    ctx,
    logger,
  }: { client: bp.Client; ctx: IntegrationContext<bp.configuration.Configuration>; logger: IntegrationLogger }
) {
  if (message?.message?.text) {
    logger.forBot().debug('Received text message from Instagram:', message.message.text)
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

    if (!user.pictureUrl || !user.name) {
      try {
        const messengerClient = getMessengerClient(ctx.configuration)
        const userProfile = (await messengerClient.getUserProfile(message.sender.id, {
          // username is an available field for instagram ids -> https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-profiles-and-media
          fields: ['id', 'name', 'profile_pic', 'username'] as any,
        })) as InstagramUserProfile

        logger.forBot().debug('Fetched latest Instagram user profile: ', userProfile)

        const fieldsToUpdate = {
          pictureUrl: userProfile?.profilePic,
          name: userProfile?.name || userProfile?.username,
        }
        if (fieldsToUpdate.pictureUrl || fieldsToUpdate.name) {
          await client.updateUser({ ...user, ...fieldsToUpdate })
        }
      } catch (error) {
        logger.forBot().error('Error while fetching user profile from Instagram', error)
      }
    }

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
