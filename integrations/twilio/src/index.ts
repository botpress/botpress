import type { Conversation } from '@botpress/client'
import type { AckFunction, IntegrationContext } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import queryString from 'query-string'
import { Twilio } from 'twilio'

import { Integration, channels, configuration, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const log = console

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async (props) => void (await sendMessage({ ...props, text: props.payload.text })),
        image: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.imageUrl })),
        markdown: async (props) => void (await sendMessage({ ...props, text: props.payload.markdown })),
        audio: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.audioUrl })),
        video: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.videoUrl })),
        file: async (props) => void (await sendMessage({ ...props, text: props.payload.fileUrl })),
        location: async (props) =>
          void (await sendMessage({
            ...props,
            text: `https://www.google.com/maps/search/?api=1&query=${props.payload.latitude},${props.payload.longitude}`,
          })),
        carousel: async (props) => {
          const {
            payload: { items },
          } = props
          const total = items.length
          for (const [i, card] of items.entries()) {
            await sendMessage({ ...props, text: renderCard(card, `${i + 1}/${total}`), mediaUrl: card.imageUrl })
          }
        },
        card: async (props) => {
          const { payload: card } = props
          await sendMessage({ ...props, text: renderCard(card), mediaUrl: card.imageUrl })
        },
        dropdown: async (props) => {
          await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
        },
        choice: async (props) => {
          await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    log.info('Handler received request')

    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    const data = queryString.parse(req.body)

    const userPhone = data.From

    if (typeof userPhone !== 'string') {
      throw new Error('Handler received an invalid user phone number')
    }

    const activePhone = data.To

    if (typeof activePhone !== 'string') {
      throw new Error('Handler received an invalid active phone number')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        'twilio:userPhone': userPhone,
        'twilio:activePhone': activePhone,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        'twilio:userPhone': userPhone,
      },
    })

    const messageSid = data.MessageSid

    if (typeof messageSid !== 'string') {
      throw new Error('Handler received an invalid message sid')
    }

    const text = data.Body

    if (typeof text !== 'string') {
      throw new Error('Handler received an invalid text')
    }

    await client.createMessage({
      tags: { 'twilio:id': messageSid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
    })

    log.info('Handler received request', data)
  },

  createUser: async ({ client, tags, ctx }) => {
    const userPhone = tags['twilio:userPhone']

    if (!userPhone) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { user } = await client.getOrCreateUser({
      tags: { 'twilio:userPhone': `${phone.phoneNumber}` },
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },

  createConversation: async ({ client, channel, tags, ctx }) => {
    const userPhone = tags['twilio:userPhone']
    const activePhone = tags['twilio:activePhone']

    if (!(userPhone && activePhone)) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { 'twilio:userPhone': `${phone.phoneNumber}`, 'twilio:activePhone': activePhone },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration)

type Choice = channels.Channels['channel']['choice']

function renderChoiceMessage(payload: Choice) {
  return `${payload.text || ''}\n\n${payload.options
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

type Card = channels.Channels['channel']['card']

function renderCard(card: Card, total?: string): string {
  return `${total ? `${total}: ` : ''}${card.title}\n\n${card.subtitle || ''}\n\n${card.actions
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

function getPhoneNumbers(conversation: Conversation) {
  const to = conversation.tags?.['twilio:userPhone']
  const from = conversation.tags?.['twilio:activePhone']

  if (!to) {
    throw new Error('Invalid to phone number')
  }

  if (!from) {
    throw new Error('Invalid from phone number')
  }

  return { to, from }
}

type SendMessageProps = {
  ctx: IntegrationContext<configuration.Configuration>
  conversation: Conversation
  ack: AckFunction
  mediaUrl?: string
  text?: string
}

async function sendMessage({ ctx, conversation, ack, mediaUrl, text }: SendMessageProps) {
  const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
  const { to, from } = getPhoneNumbers(conversation)
  const { sid } = await twilioClient.messages.create({ to, from, mediaUrl, body: text })
  await ack({ tags: { 'twilio:id': sid } })
}
