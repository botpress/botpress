import { TIntegration } from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'
import crypto from 'crypto'

export function validateWebhookSigningSecret(value: string): void {
  if (!value || !value.startsWith('whsec_')) {
    throw new RuntimeError('Webhook signing secret must start with "whsec_"')
  }

  if (value.includes(' ')) {
    throw new RuntimeError('Webhook signing secret must not contain spaces')
  }

  if (!value.split('_')[1]) {
    throw new RuntimeError('Secret must not be empty after "whsec_"')
  }
}

export const verifyWebhookSignature = async (props: WebhookHandlerProps<TIntegration>): Promise<void> => {
  const headers = props.req.headers

  const eventId = headers['webhook-id']
  const timestamp = headers['webhook-timestamp']
  const webhookSignature = headers['webhook-signature']

  if (!eventId || !timestamp || !webhookSignature) {
    throw new RuntimeError('Webhook request is missing required headers')
  }

  if (!props.req.body) {
    throw new RuntimeError('Webhook request is missing body')
  }

  const signedContent = `${eventId}.${timestamp}.${props.req.body}`

  const secret = props.ctx.configuration.webhookSigningSecret
  const secretBytes = Buffer.from(secret.split('_')[1]!, 'base64')

  const signature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  const signatureFound = webhookSignature.split(' ').some((sig) => sig.includes(`,${signature}`))
  if (!signatureFound) {
    throw new RuntimeError('Webhook signature is invalid')
  }

  props.logger.forBot().info('Webhook signature of incoming request verified successfully')
}