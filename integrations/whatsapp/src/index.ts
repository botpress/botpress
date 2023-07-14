import type { Client } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { name } from 'integration.definition'
import queryString from 'query-string'
import { WhatsAppAPI, Types } from 'whatsapp-api-js'
import { createConversation } from './conversation'
import * as card from './message-types/card'
import * as carousel from './message-types/carousel'
import * as choice from './message-types/choice'
import * as dropdown from './message-types/dropdown'
import * as outgoing from './outgoing-message'
import { Integration, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const { Text, Media, Location } = Types

const log = console

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
        dropdown: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: dropdown.generateOutgoingMessages(payload) })
        },
        choice: async ({ payload, ...props }) => {
          await outgoing.sendMany({ ...props, generator: choice.generateOutgoingMessages(payload) })
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    log.info('Handler received request')

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
      log.warn('Handler received an empty body')
      return
    }

    try {
      const data = JSON.parse(req.body) as WhatsAppPayload

      for (const { changes } of data.entry) {
        for (const change of changes) {
          if (!change.value.messages) {
            continue
          }

          for (const message of change.value.messages) {
            const accessToken = ctx.configuration.accessToken
            const whatsapp = new WhatsAppAPI(accessToken)

            const phoneNumberId = ctx.configuration.phoneNumberId
            await whatsapp.markAsRead(phoneNumberId, message.id)

            await handleMessage(message, change.value, client)
          }
        }
      }
    } catch (e: any) {
      // This is a message that will be displayed to the Bot Owner
      logger.forBot().error('Error while handling request:', e)
      log.info(req.body)
      log.error(e)
    }

    return
  },
})

export default sentryHelpers.wrapIntegration(integration)

async function handleMessage(message: WhatsAppMessage, value: WhatsAppValue, client: Client) {
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        [`${name}:userPhone`]: message.from,
        [`${name}:phoneNumberId`]: value.metadata.phone_number_id,
      },
    })

    if (value.contacts.length > 0) {
      const { user } = await client.getOrCreateUser({
        tags: {
          [`${name}:userId`]: value.contacts[0] ? value.contacts[0].wa_id : '',
          [`${name}:name`]: value.contacts[0] ? value.contacts[0]?.profile.name : '',
        },
      })

      if (message.text) {
        await client.createMessage({
          tags: { [`${name}:id`]: message.id },
          type: 'text',
          payload: { text: message.text.body },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.interactive) {
        if (message.interactive.type === 'button_reply') {
          await client.createMessage({
            tags: { [`${name}:id`]: message.id },
            type: 'text',
            payload: {
              text: message.interactive.button_reply?.id,
              metadata: message.interactive.button_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else if (message.interactive.type === 'list_reply') {
          await client.createMessage({
            tags: { [`${name}:id'`]: message.id },
            type: 'text',
            payload: {
              text: message.interactive.list_reply?.id,
              metadata: message.interactive.list_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else {
          log.warn(`Unhandled interactive type: ${JSON.stringify(message.interactive.type)}`)
        }
      } else {
        log.warn(`Unhandled message type: ${JSON.stringify(message)}`)
      }
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
