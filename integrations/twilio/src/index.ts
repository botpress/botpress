import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import queryString from 'query-string'
import { Twilio } from 'twilio'
import * as types from './types'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

const integration = new bp.Integration({
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
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    console.info('Handler received request')

    if (!req.body) {
      console.warn('Handler received an empty body')
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
        userPhone,
        activePhone,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        userPhone,
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
      tags: { id: messageSid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text },
    })

    console.info('Handler received request', data)
  },

  createUser: async ({ client, tags, ctx }) => {
    const userPhone = tags.userPhone
    if (!userPhone) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { user } = await client.getOrCreateUser({
      tags: { userPhone: `${phone.phoneNumber}` },
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },

  createConversation: async ({ client, channel, tags, ctx }) => {
    const userPhone = tags.userPhone
    const activePhone = tags.activePhone
    if (!(userPhone && activePhone)) {
      return
    }

    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    const phone = await twilioClient.lookups.phoneNumbers(userPhone).fetch()

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { userPhone: `${phone.phoneNumber}`, activePhone },
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

type Choice = bp.channels.channel.choice.Choice

function renderChoiceMessage(payload: Choice) {
  return `${payload.text || ''}\n\n${payload.options
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

type Card = bp.channels.channel.card.Card

function renderCard(card: Card, total?: string): string {
  return `${total ? `${total}: ` : ''}${card.title}\n\n${card.subtitle || ''}\n\n${card.actions
    .map(({ label }: { label: string }, idx: number) => `${idx + 1}. ${label}`)
    .join('\n')}`
}

function getPhoneNumbers(conversation: types.Conversation) {
  const to = conversation.tags?.userPhone
  const from = conversation.tags?.activePhone

  if (!to) {
    throw new Error('Invalid to phone number')
  }

  if (!from) {
    throw new Error('Invalid from phone number')
  }

  return { to, from }
}

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack'> & {
  mediaUrl?: string
  text?: string
}

async function sendMessage({ ctx, conversation, ack, mediaUrl, text }: SendMessageProps) {
  const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
  const { to, from } = getPhoneNumbers(conversation)
  const { sid } = await twilioClient.messages.create({ to, from, mediaUrl, body: text })
  await ack({ tags: { id: sid } })
}
