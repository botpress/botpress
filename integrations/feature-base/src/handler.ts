import { Request, z } from '@botpress/sdk'
import crypto from 'crypto'
import { handleIncomingTextMessage } from './channels'
import { webhookRequestSchema } from './feature-base-api'
import * as bp from '.botpress'

const webhookTopicSchema = z.object({
  topic: z.string(),
})

const isHandeledTopic = (request: z.infer<typeof webhookTopicSchema>) => {
  const topics: string[] = webhookRequestSchema.options.map((option) => option.shape.topic.value)
  return topics.includes(request.topic)
}

const MAX_TIMESTAMP_DIFF_SECS = 300 // 5 minutes

type VerifyWebhookSignatureReturn =
  | {
      isSignatureValid: true
      signatureError: null
    }
  | {
      isSignatureValid: false
      signatureError: string
    }

const _verifyWebhookSignature = (secret: string, request: Request): VerifyWebhookSignatureReturn => {
  const signature = request.headers['x-webhook-signature']
  const timestamp = request.headers['x-webhook-timestamp']

  if (!signature || !timestamp) {
    return {
      isSignatureValid: false,
      signatureError: 'Missing signature headers',
    }
  }

  const timestampDiff = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp))
  if (timestampDiff > MAX_TIMESTAMP_DIFF_SECS || isNaN(timestampDiff)) {
    return {
      isSignatureValid: false,
      signatureError: 'Webhook timestamp too old or incorrect',
    }
  }

  const signedPayload = `${timestamp}.${request.body}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'))) {
    return {
      isSignatureValid: false,
      signatureError: 'Signature invalid',
    }
  }
  return {
    isSignatureValid: true,
    signatureError: null,
  }
}

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { isSignatureValid, signatureError } = _verifyWebhookSignature(props.ctx.configuration.webhookSecret, props.req)
  if (!isSignatureValid) {
    props.logger.error(`Webhook Signature Verification: ${signatureError}`)
    return
  }

  if (!props.req.body) {
    props.logger.error('Handler received an empty body')
    return
  }

  let json: unknown | null = null
  try {
    json = JSON.parse(props.req.body)
  } catch {
    props.logger.error('Failed to parse request body as JSON')
    return
  }

  const topicResult = webhookTopicSchema.safeParse(json)

  if (!topicResult.success) {
    props.logger.error(`Failed to validate request body: ${topicResult.error.message}`)
    return
  }

  // We check that the request is actually a topic that can be handle by the handler. This prevent
  // from throwing an error because we are not able to parse the payload.
  if (!isHandeledTopic(topicResult.data)) {
    props.logger.forBot().info(`Event ${topicResult.data} filtered out`)
    return
  }

  const { success, error, data: webhookRequestPayload } = webhookRequestSchema.safeParse(json)

  if (!success) {
    props.logger.error(`Failed to validate request body: ${error.message}`)
    return
  }

  switch (webhookRequestPayload.topic) {
    case 'post.created':
      await props.client.createEvent({ type: 'postCreated', payload: webhookRequestPayload })
      break
    case 'post.updated':
      await props.client.createEvent({ type: 'postUpdated', payload: webhookRequestPayload })
      break
    case 'post.deleted':
      await props.client.createEvent({ type: 'postDeleted', payload: webhookRequestPayload })
      break
    case 'post.voted':
      await props.client.createEvent({ type: 'postVoted', payload: webhookRequestPayload })
      break
    case 'comment.created':
      await handleIncomingTextMessage(props, webhookRequestPayload)
      break
    default:
      break
  }
}
