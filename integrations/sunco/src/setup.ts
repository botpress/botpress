import { createWebhook } from 'src/api/create-webhook'
import { getStoredCredentials } from 'src/get-stored-credentials'
import { getNetworkErrorDetails } from 'src/util'
import { createClient } from './api/sunshine-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger, client, webhookUrl }) => {
  logger.forBot().info('Starting Sunshine Conversations integration registration...')

  const credentials = await getStoredCredentials(client, ctx.integrationId)

  logger.forBot().info('Registering webhook...')
  const webhook = await createWebhook({
    credentials,
    logger,
    webhookUrl,
  })

  await client.setState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: { secret: webhook.webhookSecret },
  })
  logger.forBot().info('Successfully registered webhook')
}

export const unregister: bp.IntegrationProps['unregister'] = async ({}) => {}
