import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })

  const params = {
    name: 'Webhook',
    events: ['subscriber.created'],
    url: webhookUrl,
  }

  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'mailerLiteIntegrationInfo',
    id: ctx.integrationId,
    payload: { mailerLiteWebhookId: '' },
  })

  if (!state.payload?.mailerLiteWebhookId) {
    const created = await mlClient.webhooks.create(params)
    const mailerLiteWebhookId = String(created.data.data.id)
    logger.forBot().debug('Webhook created.')

    await client.setState({
      type: 'integration',
      name: 'mailerLiteIntegrationInfo',
      id: ctx.integrationId,
      payload: { mailerLiteWebhookId },
    })
  }
}
