import { BambooHRClient } from './api/bamboohr-client'

import { BambooHRRuntimeError } from './error-handling'
import * as bp from '.botpress'

export const register: bp.Integration['register'] = async (props) => {
  const { client, ctx, logger, webhookUrl } = props
  // For OAuth mode, verify OAuth state exists
  if (ctx.configurationType !== 'manual') {
    const { state } = await client
      .getState({
        type: 'integration',
        name: 'oauth',
        id: ctx.integrationId,
      })
      .catch((thrown) => {
        const error = thrown instanceof Error ? thrown : new Error(String(thrown))
        throw new BambooHRRuntimeError('OAuth state not properly configured: ' + error.message)
      })

    if (!state.payload.accessToken || !state.payload.refreshToken) {
      const error = new Error('OAuth tokens not found. Please complete OAuth flow.')
      throw BambooHRRuntimeError.from(error, 'Error registering BambooHR integration')
    }
  }

  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })
  await bambooHrClient.testAuthorization().catch((thrown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw BambooHRRuntimeError.from(error, 'Error authorizing BambooHR integration')
  })
  logger.forBot().info('Integration is authorized.')

  const fields = await bambooHrClient.getMonitoredFields().catch((thrown) => {
    throw BambooHRRuntimeError.from(thrown, 'Error getting monitored fields')
  })

  logger.forBot().info('Setting up webhook with BambooHR...')
  try {
    const { state } = await client.getOrSetState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
      payload: { id: null, privateKey: null },
    })

    if (!state.payload.id) {
      const { id, privateKey } = await bambooHrClient.createWebhook(webhookUrl, fields)

      await client.setState({
        type: 'integration',
        name: 'webhook',
        id: ctx.integrationId,
        payload: { id, privateKey },
      })
    }
  } catch (thrown) {
    throw BambooHRRuntimeError.from(thrown, 'Error registering BambooHR webhook')
  }
  logger.forBot().info('Registered webhook.')
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  const { client, ctx, logger } = props

  if (ctx.configurationType === 'manual') {
    logger.forBot().info('Unregistering BambooHR webhook is not supported for manual configuration.')
    return
  }

  const { state } = await client
    .getState({
      name: 'webhook',
      type: 'integration',
      id: ctx.integrationId,
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

  await client.configureIntegration({
    identifier: null,
  })
}
