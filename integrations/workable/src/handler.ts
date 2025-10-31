import { Request, z } from '@botpress/sdk'
import crypto from 'crypto'
import { eventTypes } from 'definitions/events/candidates'
import { toCandidateCreatedEventModel, toCandidateMovedEventModel } from './mapping/candidate-mapper'
import { webhookRequestSchema } from './workable-schemas/events'
import * as bp from '.botpress'

const isEventTypeHandled = (request: z.infer<typeof webhookRequestSchema>) => {
  return eventTypes.options.includes(request.event_type)
}

type VerifyWebhookSignatureReturn =
  | {
      isSignatureValid: true
      signatureError: null
    }
  | {
      isSignatureValid: false
      signatureError: string
    }

const _verifyWebhookSignature = (encryptionKey: string, request: Request): VerifyWebhookSignatureReturn => {
  const signature = request.headers['x-workable-signature']

  if (!signature) {
    return {
      isSignatureValid: false,
      signatureError: 'Missing signature headers',
    }
  }

  const expected = crypto
    .createHmac('sha256', encryptionKey)
    .update(request.body ?? '')
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) {
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
  const { isSignatureValid, signatureError } = _verifyWebhookSignature(props.ctx.configuration.apiToken, props.req)
  if (!isSignatureValid) {
    props.logger.forBot().error(`Webhook Signature Verification: ${signatureError}`)
    return
  }

  if (!props.req.body) {
    props.logger.forBot().error('Handler received an empty body')
    return
  }

  let json: unknown | null = null
  try {
    json = JSON.parse(props.req.body)
  } catch {
    props.logger.forBot().error('Failed to parse request body as JSON')
    return
  }

  const webhookInfoResult = webhookRequestSchema.safeParse(json)

  if (!webhookInfoResult.success) {
    props.logger.forBot().error(`Failed to validate request body: ${webhookInfoResult.error.message}`)
    return
  }

  if (!isEventTypeHandled(webhookInfoResult.data)) {
    props.logger.forBot().info(`Event ${webhookInfoResult.data} filtered out`)
    return
  }

  const { success, error, data: webhookRequestPayload } = webhookRequestSchema.safeParse(json)

  if (!success) {
    props.logger.forBot().error(`Failed to validate request body: ${error.message}`)
    return
  }

  switch (webhookRequestPayload.event_type) {
    case 'candidate_created':
      await props.client.createEvent({
        type: 'candidateCreated',
        payload: toCandidateCreatedEventModel(webhookRequestPayload),
      })
      break
    case 'candidate_moved':
      await props.client.createEvent({
        type: 'candidateMoved',
        payload: toCandidateMovedEventModel(webhookRequestPayload),
      })
      break
    default:
      break
  }
}
