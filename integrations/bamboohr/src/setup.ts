import { RuntimeError } from '@botpress/sdk'
import { BambooHRClient } from './api/bamboohr-client'

import * as bp from '.botpress'

export const register: bp.Integration['register'] = async (props) => {
  const { client, ctx, logger, webhookUrl } = props
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })
  try {
    await bambooHrClient.testAuthorization()
    logger.forBot().info('Integration is authorized.')
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Error authorizing BambooHR integration: ' + error.message)
  }

  try {
    const { state } = await client.getOrSetState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
      payload: { id: '', privateKey: '' },
    })

    if (!state.payload.id) {
      logger.forBot().info('Setting up webhook with BambooHR...')

      const payload = await bambooHrClient.createWebhook(webhookUrl)

      await client.setState({
        type: 'integration',
        name: 'webhook',
        id: ctx.integrationId,
        payload,
      })
    }

    logger.forBot().info('Registered webhook.')
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Error registering BambooHR webhook: ' + error.message)
  }
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  const { client, ctx, logger } = props

  const { state } = await client.getOrSetState({
    name: 'webhook',
    type: 'integration',
    id: ctx.integrationId,
    payload: { id: '', privateKey: '' },
  })

  if (!state.payload.id) {
    // Not critical but shouldn't happen normally
    logger.forBot().warn('No webhook to unregister for BambooHR integration.')
    return
  }

  try {
    const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })
    const res = await bambooHrClient.deleteWebhook(state.payload.id)

    if (!res.ok) {
      throw new Error(`Webhook delete failed with status ${res.status} ${res.statusText}`)
    }

    await client.setState({
      type: 'integration',
      name: 'webhook',
      id: ctx.integrationId,
      payload: { id: '', privateKey: '' },
    })
    logger.forBot().info('Unregistered webhook.')
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Error unregistering BambooHR webhook: ' + error.message)
  }
}
