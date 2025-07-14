import { Webhook } from 'svix'
import { Result } from './types'
import { safeParseJson } from './utils'
import * as bp from '.botpress'

const SVIX_ID_HEADER = 'svix-id'
const SVIX_SIGNATURE_HEADER = 'svix-signature'
const SVIX_TIMESTAMP_HEADER = 'svix-timestamp'

type ParsedWebhookData =
  | { body: unknown; signingSecret: null }
  | {
      body: unknown
      signingSecret: string
      payload: string
      svixId: string
      svixSignature: string
      svixTimestamp: string
    }

export const parseWebhookData = (props: bp.HandlerProps): Result<ParsedWebhookData> => {
  if (!props.req.body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const result = safeParseJson(props.req.body)
  if (!result.success) {
    return { success: false, error: new Error('Unable to parse Resend Webhook Payload', result.error) }
  }

  const parsedBody = result.data
  const signingSecret = props.ctx.configuration.signingSecret
  const svixId = props.req.headers[SVIX_ID_HEADER]
  const svixSignature = props.req.headers[SVIX_SIGNATURE_HEADER]
  const svixTimestamp = props.req.headers[SVIX_TIMESTAMP_HEADER]

  if (!signingSecret) {
    if (svixId || svixSignature || svixTimestamp) {
      props.logger.warn(
        "Webhook signatures are enabled in Resend but the signing secret hasn't been provided in the Botpress configuration"
      )
    }

    return {
      success: true,
      data: {
        body: parsedBody,
        signingSecret: null,
      },
    }
  }

  if (!svixId || !svixSignature || !svixTimestamp) {
    const error = new Error('A signing secret was provided but webhook request is missing the required headers')
    props.logger.error(error.message)
    return {
      success: false,
      error,
    }
  }

  return {
    success: true,
    data: {
      body: parsedBody,
      // The raw body MUST NOT be trimmed of whitespace!
      payload: props.req.body,
      signingSecret,
      svixId,
      svixTimestamp,
      svixSignature,
    },
  }
}

export const verifyWebhookSignature = (data: Extract<ParsedWebhookData, { signingSecret: string }>) => {
  const wh = new Webhook(data.signingSecret)

  const headers = {
    'svix-id': data.svixId,
    'svix-timestamp': data.svixTimestamp,
    'svix-signature': data.svixSignature,
  }

  try {
    wh.verify(data.payload, headers)
    return true
  } catch {
    return false
  }
}
