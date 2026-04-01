import { RuntimeError } from '@botpress/sdk'
import { getHitlClient, HubSpotHitlClient } from './hitl/client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  if (ctx.configurationType === null && bp.secrets.DISABLE_OAUTH === 'true') {
    await client.configureIntegration({
      identifier: null,
    })
    throw new RuntimeError('OAuth currently unavailable, please use manual configuration instead')
  }

  if (!ctx.configuration.enableHitl || !ctx.configuration.inboxId) {
    return
  }

  const hitlClient = getHitlClient(ctx, client, logger)
  const { appId, developerApiKey } = _resolveHitlCredentials(ctx)

  if (!appId) {
    throw new RuntimeError('APP_ID secret is required for HITL in OAuth mode. Please configure it.')
  }

  // Check if a valid channel already exists
  const existingState = await client
    .getState({ type: 'integration', name: 'hitlChannelInfo', id: ctx.integrationId })
    .catch(() => null)

  if (existingState?.state?.payload?.channelId) {
    const existingChannelId = existingState.state.payload.channelId
    try {
      const channels = await hitlClient.getCustomChannels(appId, developerApiKey)
      if (channels.results.some((c: any) => c.id === existingChannelId)) {
        logger.forBot().info(`Existing HITL channel ${existingChannelId} is still valid. Skipping creation.`)
        return
      }
      logger.forBot().warn(`Stored HITL channel ${existingChannelId} not found in HubSpot. Creating new one.`)
    } catch (err) {
      logger.forBot().warn('Could not verify existing channel, will attempt creation.')
    }
  }

  const newChannelId = await hitlClient.createCustomChannel(appId, developerApiKey)
  logger.forBot().info(`Created HITL custom channel: ${newChannelId}`)

  await _waitForChannelAvailability(hitlClient, newChannelId, appId, developerApiKey, logger)

  const channelAccount = await hitlClient.connectCustomChannel(
    newChannelId,
    ctx.configuration.inboxId,
    'Botpress Channel'
  )
  const channelAccountId = channelAccount.data!.id

  await client.setState({
    type: 'integration',
    name: 'hitlChannelInfo',
    id: ctx.integrationId,
    payload: { channelId: newChannelId, channelAccountId },
  })

  logger.forBot().info(`HITL channel connected to inbox ${ctx.configuration.inboxId}. Account ID: ${channelAccountId}`)
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  const channelState = await client
    .getState({ type: 'integration', name: 'hitlChannelInfo', id: ctx.integrationId })
    .catch(() => null)

  if (!channelState?.state?.payload?.channelId) {
    return
  }

  const { channelId } = channelState.state.payload
  const hitlClient = getHitlClient(ctx, client, logger)
  const { appId, developerApiKey } = _resolveHitlCredentials(ctx)

  if (!appId) {
    logger.forBot().warn('Cannot delete HITL channel: APP_ID not configured')
    return
  }

  const result = await hitlClient.deleteCustomChannel(channelId, appId, developerApiKey)
  if (result.success) {
    logger.forBot().info(`Deleted HITL custom channel ${channelId}`)
  } else {
    logger.forBot().warn(`Could not delete HITL channel ${channelId} — may need manual cleanup`)
  }
}

function _resolveHitlCredentials(ctx: bp.Context): { appId: string | undefined; developerApiKey: string | undefined } {
  if (ctx.configurationType === 'manual') {
    return {
      appId: ctx.configuration.appId,
      developerApiKey: ctx.configuration.developerApiKey,
    }
  }
  return {
    appId: bp.secrets.APP_ID,
    developerApiKey: bp.secrets.DEVELOPER_API_KEY,
  }
}

async function _waitForChannelAvailability(
  hitlClient: HubSpotHitlClient,
  channelId: string,
  appId: string,
  developerApiKey: string | undefined,
  logger: bp.Logger
): Promise<void> {
  const maxAttempts = 6
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const channels = await hitlClient.getCustomChannels(appId, developerApiKey)
    if (channels.results.some((c: any) => c.id === channelId)) {
      logger.forBot().info(`Channel ${channelId} available after ${attempt + 1} attempt(s)`)
      return
    }
    const delay = Math.pow(2, attempt) * 1000
    logger.forBot().warn(`Channel ${channelId} not yet available. Retrying in ${delay / 1000}s...`)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  logger.forBot().warn(`Channel ${channelId} still not visible after ${maxAttempts} attempts — proceeding anyway`)
}
