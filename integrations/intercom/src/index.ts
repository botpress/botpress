import { RuntimeError } from '@botpress/client'
import { Request, z } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as crypto from 'crypto'
import { ReplyToConversationMessageType } from 'intercom-client'
import { getAuthenticatedIntercomClient, getSignatureSecret, handleOAuth } from './auth'
import * as html from './html.utils'
import * as types from './types'
import * as bp from '.botpress'

type Card = bp.channels.channel.card.Card
type Location = bp.channels.channel.location.Location

type IntercomMessage = z.infer<typeof conversationSourceSchema>

type VerifyResult =
  | { result: 'success'; isError: false; parsedNotification: z.infer<typeof webhookNotificationSchema> }
  | { result: 'error'; isError: true; message: string }
  | { result: 'ignore'; isError: false; message?: string }

const conversationSourceSchema = z.object({
  id: z.string(),
  author: z.object({
    id: z.string(),
    email: z.string().nullable(),
    type: z.string(),
  }),
  body: z.string().nullable(),
})

const conversationPartSchema = conversationSourceSchema.extend({
  type: z.literal('conversation_part'),
})

const conversationSchema = z.object({
  type: z.literal('conversation'),
  admin_assignee_id: z
    .number()
    .nullable()
    .transform((val) => (val ? val.toString() : null)),
  id: z.string(),
  source: conversationSourceSchema,
  conversation_parts: z.object({
    conversation_parts: z.array(conversationPartSchema),
  }),
})

const pingSchema = z.object({
  type: z.literal('ping'),
})

const webhookNotificationSchema = z.object({
  type: z.literal('notification_event'),
  topic: z.string(),
  data: z.object({
    item: z.union([conversationSchema, pingSchema]),
  }),
})

const integration = new bp.Integration({
  register: async ({ client, ctx }) => {
    const adminId = ctx.configuration.adminId
    await client.updateUser({
      id: ctx.botUserId,
      tags: { id: adminId },
    })
  },
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, conversation, ack, client, ctx }) => {
          await sendMessage({
            body: payload.text,
            conversation,
            client,
            ctx,
            ack,
          })
        },
        image: async ({ payload, client, ctx, conversation, ack }) => {
          await sendMessage({
            body: '',
            conversation,
            client,
            ctx,
            ack,
            attachmentUrls: [payload.imageUrl],
          })
        },
        markdown: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: payload.markdown,
            conversation,
            client,
            ctx,
            ack,
          })
        },
        audio: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: '',
            conversation,
            client,
            ctx,
            ack,
            attachmentUrls: [payload.audioUrl],
          })
        },
        video: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: '',
            conversation,
            client,
            ctx,
            ack,
            attachmentUrls: [payload.videoUrl],
          })
        },
        file: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: '',
            conversation,
            client,
            ctx,
            ack,
            attachmentUrls: [payload.fileUrl],
          })
        },
        location: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: formatGoogleMapLink(payload),
            conversation,
            client,
            ctx,
            ack,
          })
        },
        carousel: async ({ client, ctx, conversation, ack, payload }) => {
          const carousel = payload.items.map((card) => createCard(card)).join('')

          await sendMessage({
            body: carousel,
            conversation,
            client,
            ctx,
            ack,
          })
        },
        card: async ({ client, ctx, conversation, ack, payload }) => {
          await sendMessage({
            body: createCard(payload),
            conversation,
            client,
            ctx,
            ack,
          })
        },
        dropdown: async ({ client, ctx, conversation, ack, payload }) => {
          const choices = payload.options.map((choice) => html.li(choice.value))

          const message = composeMessage(
            html.p(payload.text),
            html.p('Type one of the following options:'),
            choices.length > 0 ? html.ol(choices.join('')) : ''
          )

          await sendMessage({
            body: message,
            conversation,
            client,
            ctx,
            ack,
          })
        },
        choice: async ({ client, ctx, conversation, ack, payload }) => {
          const choices = payload.options.map((choice) => html.li(choice.value))

          const message = composeMessage(
            html.p(payload.text),
            html.p('Type one of the following options:'),
            choices.length > 0 ? html.ol(choices.join('')) : ''
          )

          await sendMessage({
            body: message,
            conversation,
            client,
            ctx,
            ack,
          })
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async (props) => {
    console.info('Handler received request')

    const { req, client, ctx } = props
    if (req.path.startsWith('/oauth')) {
      return await handleOAuth(props)
    }

    const verifyResult = verifyRequest(req, ctx)
    if (verifyResult.isError) {
      throw new RuntimeError(`Invalid request received: ${verifyResult.message}`)
    } else if (verifyResult.result === 'ignore') {
      console.info(`Handler ignored request: ${verifyResult.message ?? 'Unknown reason'}`)
      return
    }

    const notification = verifyResult.parsedNotification
    if (notification.data.item.type === 'ping') {
      console.info('Handler received a ping event')
      return
    }

    const {
      topic,
      data: {
        item: {
          id: conversationId,
          conversation_parts: { conversation_parts },
          source: firstConversationPart,
        },
      },
    } = notification

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: conversationId,
      },
    })

    // this uses the message payload from intercom to create the message in the bot
    const createMessage = async (intercomMessage: IntercomMessage) => {
      const {
        author: { id: authorId, email, type: authorType },
        body,
        id: messageId,
      } = intercomMessage

      if (!messageId) {
        throw new Error('Handler received an empty message id')
      }

      if (!body) {
        return // ignore no body messages
      }

      if (authorType === 'bot') {
        console.info(`Handler received a bot message with id ${messageId}`)
        return // ignore bot messages
      }

      const user = await getOrCreateUserAndUpdate(client, {
        id: authorId,
        email,
      })

      await client.getOrCreateMessage({
        tags: { id: messageId },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: html.stripTags(body) },
      })
    }

    if (topic === 'conversation.user.created') {
      await createMessage(firstConversationPart) // important, intercom keeps the first message in a separate object
    }

    for (const part of conversation_parts) {
      await createMessage(part)
    }

    console.info('Handler finished processing request')
    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
    const { id, email } = await intercomClient.contacts.find({ id: userId })
    const user = await getOrCreateUserAndUpdate(client, {
      id,
      email,
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const conversationId = tags.id
    if (!conversationId) {
      return
    }

    const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
    const chat = await intercomClient.conversations.find({ id: conversationId })

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: chat.id },
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

async function sendMessage(
  props: Pick<types.MessageHandlerProps, 'conversation' | 'client' | 'ctx' | 'ack'> & {
    body: string
    attachmentUrls?: string[]
  }
) {
  const { body, attachmentUrls, client, ctx, conversation, ack } = props
  const { configuration } = ctx
  const intercomClient = await getAuthenticatedIntercomClient(client, ctx)

  const {
    conversation_parts: { conversation_parts: conversationParts },
  } = await intercomClient.conversations.replyByIdAsAdmin({
    id: conversation.tags.id ?? '',
    adminId: configuration.adminId,
    messageType: ReplyToConversationMessageType.COMMENT,
    body,
    attachmentUrls,
  })

  const lastMessageId = conversationParts.at(-1)?.id
  await ack({ tags: { id: lastMessageId } })
}

function composeMessage(...parts: string[]) {
  return parts.join('')
}

function createCard({ title, subtitle, imageUrl, actions }: Card) {
  const image = imageUrl ? html.img(imageUrl) : ''
  const text = html.b(title) + html.p(subtitle ? subtitle : '')

  const links = actions.filter((item) => item.action === 'url').map((item) => html.li(html.a(item.value, item.label)))

  const choices = actions
    .filter((item) => item.action !== 'url')
    .map((item) => html.li(item.value))
    .join('')

  return composeMessage(
    image,
    text,
    links.length > 0 ? html.ul(links.join('')) : '',
    html.p('Type one of the following options:'),
    html.ol(choices)
  )
}

function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}

function extractSignature(req: Request) {
  const signatureKv = req.headers['x-hub-signature']
  if (!signatureKv) {
    return undefined
  }
  const signature = signatureKv.split('=')[1]
  return signature
}

function isSignatureValid(signature: string, body: string, secret: string) {
  const hash = crypto.createHmac('sha1', secret).update(body).digest('hex')
  return hash === signature
}

function verifyRequest(req: Request, ctx: bp.Context): VerifyResult {
  if (!req.body) {
    return { result: 'error', isError: true, message: 'Handler received an empty body' }
  }
  const signature = extractSignature(req)
  const secret = getSignatureSecret(ctx)
  if (!signature || !isSignatureValid(signature, req.body, secret)) {
    return { result: 'error', isError: true, message: 'Handler received request with invalid signature' }
  }

  let parsedJSON
  try {
    parsedJSON = JSON.parse(req.body)
  } catch {
    return { result: 'error', isError: true, message: 'Handler received an invalid JSON body' }
  }
  const parsedBody = webhookNotificationSchema.safeParse(parsedJSON)
  if (!parsedBody.success) {
    return { result: 'error', isError: true, message: `Handler received an invalid body: ${parsedBody.error}` }
  }

  const parsedNotification = parsedBody.data
  if (parsedNotification.data.item.type === 'ping') {
    // No further validation for ping events
    return { result: 'success', isError: false, parsedNotification }
  }

  const SUBSCRIBED_TOPICS = ['conversation.user.created', 'conversation.user.replied']
  if (!SUBSCRIBED_TOPICS.includes(parsedNotification.topic)) {
    return { result: 'ignore', isError: false, message: `Ignoring topic: ${parsedNotification.topic}` }
  }

  if (ctx.configuration.adminId !== parsedNotification.data.item.admin_assignee_id) {
    // Ignore conversations not assigned to the bot
    return { result: 'ignore', isError: false, message: 'Ignoring conversations not assigned to the bot' }
  }

  return { result: 'success', isError: false, parsedNotification }
}

const getOrCreateUserAndUpdate = async (client: bp.Client, { id, email }: { id: string; email?: string | null }) => {
  let { user } = await client.getOrCreateUser({
    tags: { id },
  })
  if (email && email !== user.tags.email) {
    const updateResponse = await client.updateUser({
      id: user.id,
      tags: { email },
    })
    user = updateResponse.user
  }
  return user
}
