import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import queryString from 'query-string'
import { WhatsAppAPI, Types } from 'whatsapp-api-js'
import { createConversation } from './conversation'
import * as card from './message-types/card'
import * as carousel from './message-types/carousel'
import * as choice from './message-types/choice'
import * as dropdown from './message-types/dropdown'
import * as outgoing from './outgoing-message'
import { Integration, IntegrationProps, secrets } from '.botpress'

// TODO: Export these types publicly from the SDK and import them here.
export type CreateConversationPayload = {
  channel: string
  tags: Record<string, string>
}
export type IntegrationLogger = Parameters<IntegrationProps['handler']>[0]['logger']
export type IntegrationContext = Parameters<IntegrationProps['handler']>[0]['ctx']
export type Client = Parameters<IntegrationProps['handler']>[0]['client']

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const { Text, Media, Location } = Types

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  createConversation,
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) => {
          await outgoing.send({ ...props, message: new Text(payload.text) })
        },
        image: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Media.Image(payload.imageUrl, false),
          })
        },
        markdown: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Text(payload.markdown),
          })
        },
        audio: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Media.Audio(payload.audioUrl, false),
          })
        },
        video: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Media.Video(payload.videoUrl, false),
          })
        },
        file: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Media.Document(payload.fileUrl, false),
          })
        },
        location: async ({ payload, ...props }) => {
          await outgoing.send({
            ...props,
            message: new Location(payload.longitude, payload.latitude),
          })
        },
        carousel: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: carousel.generateOutgoingMessages(payload) })
        },
        card: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: card.generateOutgoingMessages(payload) })
        },
        dropdown: async ({ payload, logger, ...props }) => {
          await outgoing.sendMany({
            ...props,
            logger,
            generator: dropdown.generateOutgoingMessages({ payload, logger }),
          })
        },
        choice: async ({ payload, logger, ...props }) => {
          await outgoing.sendMany({ ...props, logger, generator: choice.generateOutgoingMessages({ payload, logger }) })
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    logger.forBot().debug('Handler received request from Whatsapp with payload:', req.body)

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
            .warn("Returning HTTP 403 as the Whatsapp token doesn't match the one in the bot configuration")
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
      const data = JSON.parse(req.body) as WhatsAppPayload

      for (const { changes } of data.entry) {
        for (const change of changes) {
          if (!change.value.messages) {
            // If the change doesn't contain messages we can ignore it, as we don't currently process other change types (such as statuses).
            continue
          }

          for (const message of change.value.messages) {
            const accessToken = ctx.configuration.accessToken
            const whatsapp = new WhatsAppAPI(accessToken)

            const phoneNumberId = ctx.configuration.phoneNumberId
            await whatsapp.markAsRead(phoneNumberId, message.id)

            await handleMessage(message, change.value, client, logger)
          }
        }
      }
    } catch (e: any) {
      logger.forBot().error('Error while handling request:', e)
      logger.forBot().debug('Request body received:', req.body)
    }

    return
  },
})

export default sentryHelpers.wrapIntegration(integration)

async function handleMessage(
  message: WhatsAppMessage,
  value: WhatsAppValue,
  client: Client,
  logger: IntegrationLogger
) {
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        userPhone: message.from,
        phoneNumberId: value.metadata.phone_number_id,
      },
    })

    if (value.contacts.length > 0) {
      const { user } = await client.getOrCreateUser({
        tags: {
          userId: value.contacts[0] ? value.contacts[0].wa_id : '',
          name: value.contacts[0] ? value.contacts[0]?.profile.name : '',
        },
      })

      if (message.text) {
        logger.forBot().debug('Received text message from Whatsapp:', message.text.body)

        await client.createMessage({
          tags: { id: message.id },
          type: 'text',
          payload: { text: message.text.body },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.interactive) {
        if (message.interactive.type === 'button_reply') {
          logger.forBot().debug('Received button reply from Whatsapp:', message.interactive.button_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.button_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.button_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else if (message.interactive.type === 'list_reply') {
          logger.forBot().debug('Received list reply from Whatsapp:', message.interactive.list_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.list_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.list_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else {
          logger.forBot().warn(`Unhandled interactive type: ${JSON.stringify(message.interactive.type)}`)
        }
      } else {
        logger.forBot().warn(`Unhandled message type: ${JSON.stringify(message)}`)
      }
    } else {
      logger.forBot().warn('Ignored message from Whatsapp because it did not have any contacts')
    }
  }
}

type WhatsAppPayload = {
  object: string
  entry: WhatsAppEntry[]
}

type WhatsAppEntry = {
  id: string
  changes: WhatsAppChanges[]
}

type WhatsAppChanges = {
  value: WhatsAppValue
  field: string
}

type WhatsAppValue = {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts: WhatsAppProfile[]
  messages: WhatsAppMessage[]
}

type WhatsAppProfile = {
  profile: {
    name: string
  }
  wa_id: string
}

type WhatsAppMessage = {
  from: string
  id: string
  timestamp: string
  text?: {
    body: string
  }
  image?: {
    mime_type: string
    body: string
    sha256: string
    id: string
  }
  location?: {
    address: string
    latitude: string
    longitude: string
    name: string
    url: string
  }
  document?: {
    filename: string
    mime_type: string
    sha256: string
    id: string
  }
  audio?: {
    //could be audio file, or voice note
    mime_type: string
    sha256: string
    id: string
    voice: boolean
  }
  errors?: {
    code: number
    title: string
  }
  interactive?: {
    type: string
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description: string
    }
  }
  //contacts?: not implemented - long and didn't find a use case for it
  type: string
}
