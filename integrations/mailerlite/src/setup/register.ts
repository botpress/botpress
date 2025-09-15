import { getAuthenticatedMailerLiteClient } from 'src/utils'
import { webhookResourceSchema } from '../../definitions/schemas'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })

  const params = {
    name: 'Webhook',
    events: ['subscriber.created'],
    url: webhookUrl,
  }

  let mailerLiteWebhookId

  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'mailerLiteIntegrationInfo',
    type: 'integration',
  })

  if ( state === null ) return

  try {
    const response = await mlClient.webhooks.create(params)
    const validatedData = webhookResourceSchema.parse(response.data.data)
    mailerLiteWebhookId = String(validatedData.id)
    logger.forBot().debug('Webhook created')
  } catch (error) {
    logger.error('Failed to create webhook:', error)
    throw new Error('Webhook setup failed')
  }

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'mailerLiteIntegrationInfo',
    payload: {
      mailerLiteWebhookId,
    },
  })
}
