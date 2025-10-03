import { RuntimeError } from '@botpress/sdk'
import { BambooHRClient } from './api/bamboohr-client'

import * as bp from '.botpress'

export const register: bp.Integration['register'] = async (props) => {
  const { client, ctx, logger, webhookUrl } = props

  let bambooHrClient: BambooHRClient
  try {
    logger.forBot().info('Testing BambooHR authorization...')

    bambooHrClient = await BambooHRClient.create(props)
    await bambooHrClient.testAuthorization(props)

    logger.forBot().info('Integration is authorized.')
  } catch (err) {
    throw new RuntimeError('Error authorizing BambooHR integration', err as Error)
  }

  try {
    const { state } = await client.getOrSetState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
      payload: { webhookId: '', privateKey: '' },
    })

    if (!state.payload.webhookId) {
      logger.forBot().info('Setting up webhook with BambooHR...')

      const { id, privateKey } = await bambooHrClient.createWebhook(props, webhookUrl)

      await client.setState({
        type: 'integration',
        name: 'webhook',
        id: ctx.integrationId,
        payload: { webhookId: id, privateKey },
      })
    }

    logger.forBot().info('Registered webhook.')
  } catch (err) {
    throw new RuntimeError('Error registering BambooHR webhook.', err as Error)
  }
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  const { client, ctx, logger } = props

  const { state } = await client.getOrSetState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: { webhookId: '', privateKey: '' },
  })

  if (!state.payload.webhookId) {
    // Not critical but shouldn't happen normally
    logger.forBot().warn('No webhook to unregister for BambooHR integration.')
    return
  }

  try {
    const bambooHrClient = await BambooHRClient.create(props)
    const res = await bambooHrClient.deleteWebhook(props, state.payload.webhookId)

    if (!res.ok) {
      throw new Error(`Webhook delete failed with status ${res.status} ${res.statusText}`)
    }

    await client.setState({
      type: 'integration',
      name: 'webhook',
      id: ctx.integrationId,
      payload: { webhookId: '', privateKey: '' },
    })
    logger.forBot().info('Unregistered webhook.')
  } catch (err) {
    throw new RuntimeError('Error unregistering BambooHR webhook.', err as Error)
  }
}
