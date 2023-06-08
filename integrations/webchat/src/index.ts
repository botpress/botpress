import type { Client, Conversation } from '@botpress/client'
import { MessagingChannel, MessagingClient } from '@botpress/messaging-client'
import type { IntegrationContext } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as bridge from './messaging/bridge'
import { ConversationStarted, incomingEventSchema, NewMessage, NewUser } from './messaging/incoming-event'
import type { OutgoingMessage } from './messaging/outgoing-message'
import { Integration, configuration as configurationType, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const integrationName = 'webchat'
const integrationStateType = 'integration'
const integrationStateName = 'webchatintegration'

const log = console

type Context = IntegrationContext<configurationType.Configuration>

const USER_DATA_STATE_NAME = 'userData'

const integration = new Integration({
  register: async (props) => {
    const {
      client,
      ctx: { integrationId, configuration },
      webhookUrl,
    } = props

    const { messagingUrl, clientId, clientToken, adminKey } = configuration

    const channel = new MessagingChannel({ url: messagingUrl, adminKey })
    channel.start(clientId, { clientToken })

    const { webhooks } = await channel.sync(clientId, { webhooks: [{ url: webhookUrl }] })

    const webhook = webhooks[0]

    if (!webhook) {
      throw new Error('No webhook found')
    }

    if (!webhook.token) {
      throw new Error('No webhook token')
    }

    await client.setState({
      type: integrationStateType,
      id: integrationId,
      name: integrationStateName,
      payload: { webhookToken: webhook.token, webhook: { token: webhook.token } },
    })
  },
  unregister: async () => {},
  actions: {
    getUserData: async ({ client, input }) => {
      try {
        const resp = await client.getState({ type: 'user', id: input.userId, name: USER_DATA_STATE_NAME })
        return { userData: resp.state.payload }
      } catch (err) {
        if ((err as any).type === 'ResourceNotFound') {
          return {}
        }
        throw err
      }
    },
  },
  channels: {
    channel: {
      messages: {
        text: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'text', text: payload.text, markdown: true } })
        },
        image: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'image', image: payload.imageUrl } })
        },
        markdown: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'text', text: payload.markdown, markdown: true } })
        },
        audio: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'audio', audio: payload.audioUrl } })
        },
        video: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'video', video: payload.videoUrl } })
        },
        file: async (params) => {
          const { payload } = params
          await send({ ...params, message: { type: 'file', file: payload.fileUrl, title: payload.title } })
        },
        location: async (params) => {
          const { payload } = params
          await send({
            ...params,
            message: { type: 'location', latitude: payload.latitude, longitude: payload.longitude },
          })
        },
        carousel: async (params) => {
          const cards = params.payload.items

          await send({
            ...params,
            message: {
              type: 'carousel',
              items: cards.map(bridge.inputCardToMessagingCard),
            },
          })
        },
        card: async (params) => {
          const card = params.payload

          await send({
            ...params,
            message: {
              type: 'card',
              ...bridge.inputCardToMessagingCard(card),
            },
          })
        },
        dropdown: async (params) => {
          const choice = params.payload
          await send({
            ...params,
            message: {
              type: 'dropdown',
              message: choice.text,
              options: choice.options.map((c) => ({ label: c.label, value: c.value })),
            },
          })
        },
        choice: async (params) => {
          const choice = params.payload
          await send({
            ...params,
            message: {
              type: 'single-choice',
              text: choice.text,
              choices: choice.options.map((option) => ({ title: option.label, value: option.value })),
            },
          })
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    const jsonBody = JSON.parse(req.body)
    log.debug('Handler received event', JSON.stringify(jsonBody, null, 2))
    const body = incomingEventSchema.parse(jsonBody)

    switch (body.type) {
      case 'message.new':
        await handleNewMessage(body.data, client)
        break
      case 'user.new':
        await handleNewUser(body.data, client)
        break
      case 'user.updated':
        await handleUpdateUser(body.data, client)
        break
      case 'conversation.started':
        await handleConversationStarted(body.data, client)
        break
      default:
        log.warn('Unknown message type', body.type)
        return
    }
  },
})

export default sentryHelpers.wrapIntegration(integration)

const send = async (params: { message: OutgoingMessage; ctx: Context; conversation: Conversation; client: Client }) => {
  const { message, ctx, client, conversation } = params

  const { configuration, integrationId } = ctx
  const { messagingUrl, clientId, clientToken } = configuration

  const {
    state: { payload: statePayload },
  } = await client.getState({ id: integrationId, type: integrationStateType, name: integrationStateName })

  const webhookToken = statePayload.webhookToken ?? statePayload.webhook.token

  if (!webhookToken) {
    throw new Error('No webhook token')
  }

  const messagingClient = new MessagingClient({
    url: messagingUrl,
    clientId,
    clientToken,
    webhookToken,
  })

  const conversationId = conversation.tags[`${integrationName}:id`]

  if (!conversationId) {
    throw new Error('No conversation id')
  }

  await messagingClient.createMessage(conversationId, undefined, message)
}

async function handleNewMessage(newMessage: NewMessage, client: Client) {
  if (!newMessage.message.authorId) {
    log.info('Ignoring message from bot')
    return
  }

  const { conversationId, message } = newMessage

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      [`${integrationName}:id`]: conversationId,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      [`${integrationName}:id`]: newMessage.userId,
    },
  })

  await client.createMessage({
    tags: { [`${integrationName}:id`]: message.id },
    type: message.payload.type,
    userId: user.id,
    conversationId: conversation.id,
    payload: message.payload,
  })
}

async function handleNewUser(newUser: NewUser, client: Client) {
  const { user } = await client.getOrCreateUser({
    tags: {
      [`${integrationName}:id`]: newUser.userId,
    },
  })

  if (newUser.userData) {
    await client.setState({
      type: 'user',
      id: user.id,
      name: USER_DATA_STATE_NAME,
      payload: newUser.userData,
    })
  }
}

async function handleUpdateUser(newUser: NewUser, client: Client) {
  const { user } = await client.getOrCreateUser({
    tags: {
      [`${integrationName}:id`]: newUser.userId,
    },
  })

  await client.setState({
    type: 'user',
    id: user.id,
    name: USER_DATA_STATE_NAME,
    payload: newUser.userData ?? null,
  })
}

async function handleConversationStarted(conversationStarted: ConversationStarted, client: Client) {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      [`${integrationName}:id`]: conversationStarted.conversationId,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      [`${integrationName}:id`]: conversationStarted.userId,
    },
  })

  await client.createEvent({
    type: `${integrationName}:conversationStarted`,
    payload: {
      userId: user.id,
      conversationId: conversation.id,
    },
  })
}
