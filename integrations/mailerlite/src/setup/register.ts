import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'
import { webhookResourceSchema } from '../../definitions/schemas'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })

  const params = {
    name: 'Webhook',
    events: ['subscriber.created', 'campaign.sent'],
    url: webhookUrl,
  }

  let mailerLiteWebhookId
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
