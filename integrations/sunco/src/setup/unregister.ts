import { getSuncoClient } from 'src/client'
import { getStoredCredentials } from 'src/get-stored-credentials'
import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { client, ctx, logger } = props
  logger.forBot().info('Starting Sunshine Conversations integration unregistration...')

  const credentials = await getStoredCredentials(client, ctx)
  if (credentials.configType === 'manual') {
    logger.forBot().info('Configuration type is manual, nothing to unregister.')
    return
  }

  const {
    state: { payload: webhook },
  } = await client.getState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
  })

  if (webhook?.id) {
    await getSuncoClient(credentials).deleteWebhook(webhook.id)
    logger.forBot().info('Webhook removed successfully')
  } else {
    logger.forBot().info('No stored webhook ID found, nothing to remove')
  }
}
