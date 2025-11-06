import { RuntimeError } from '@botpress/client'
import { Request, z } from '@botpress/sdk'
import * as crypto from 'crypto'
import { getSignatureSecret, handleOAuth } from './auth'
import * as html from './html.utils'
import * as bp from '.botpress'

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

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  console.info('Handler received request')

  const { req, client, ctx } = props
  if (req.path.startsWith('/oauth')) {
    return await handleOAuth(props)
  }

  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  const { adminId } = state.payload

  const verifyResult = verifyRequest(req, ctx, adminId)
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

function verifyRequest(req: Request, ctx: bp.Context, adminId: string): VerifyResult {
  if (!req.body) {
    return { result: 'error', isError: true, message: 'Handler received an empty body' }
  }
  const signature = extractSignature(req)
  const secret = getSignatureSecret(ctx)
  if (secret && (!signature || !isSignatureValid(signature, req.body, secret))) {
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

  if (adminId !== parsedNotification.data.item.admin_assignee_id) {
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
