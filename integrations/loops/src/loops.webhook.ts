import { TIntegration } from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { WebhookHandlerProps } from '@botpress/sdk/dist/integration'

export const verifyRequest = async (props: WebhookHandlerProps<TIntegration>): Promise<void> => {
  const req = props.req
  const eventId = req.headers['webhook-id']
  const timeStamp = req.headers['webhook-timestamp']
  const webhookSignature = req.headers['webhook-signature']

  if (!eventId || !timeStamp || !webhookSignature) {
    throw new RuntimeError('Webhook request is missing required headers')
  }
}