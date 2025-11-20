import { BambooHRClient } from './api/bamboohr-client'

import * as bp from '.botpress'
import { BambooHRRuntimeError } from './error-handling'

export const register: bp.Integration['register'] = async (props) => {
  const { client, ctx, logger, webhookUrl } = props
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })
  try {
    await bambooHrClient.testAuthorization()
    logger.forBot().info('Integration is authorized.')
  } catch (thrown) {
    throw BambooHRRuntimeError.from(thrown, 'Error authorizing BambooHR integration')
  }

  try {
    const { state } = await client.getOrSetState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
      payload: { id: null, privateKey: null },
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
    throw BambooHRRuntimeError.from(thrown, 'Error registering BambooHR webhook')
  }
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  const { client, ctx, logger } = props

  const { state } = await client
    .getOrSetState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
      payload: { id: null, privateKey: null },
    })
    .catch((thrown) => {
      throw BambooHRRuntimeError.from(thrown, 'Error getting webhook state.')
    })

  if (!state.payload.id) {
    // Not critical but shouldn't happen normally
    logger.forBot().warn('No webhook to unregister for BambooHR integration.')
    return
  }

  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger }).catch((thrown) => {
    throw BambooHRRuntimeError.from(thrown, 'Error creating BambooHR client for unregisterstration')
  })

  const res = await bambooHrClient.deleteWebhook(state.payload.id).catch((thrown) => {
    throw BambooHRRuntimeError.from(thrown, 'Error deleting BambooHR webhook')
  })

  if (!res.ok) {
    throw new BambooHRRuntimeError(`Webhook delete failed with status ${res.status} ${res.statusText}`)
  }

  await client
    .setState({
      type: 'integration',
      name: 'webhook',
      id: ctx.integrationId,
      payload: { id: null, privateKey: null },
    })
    .catch((thrown) => {
      throw BambooHRRuntimeError.from(thrown, 'Error clearing BambooHR webhook state')
    })

  logger.forBot().info('Unregistered webhook.')
}
