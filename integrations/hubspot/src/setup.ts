import { RuntimeError } from '@botpress/sdk'
import { getHitlClient } from './hitl/client'
import { setupHitlChannel } from './hitl/setup'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  if (ctx.configurationType === null && bp.secrets.DISABLE_OAUTH === 'true') {
    await client.configureIntegration({
      identifier: null,
    })
    throw new RuntimeError('OAuth currently unavailable, please use manual configuration instead')
  }

  if (ctx.configurationType !== 'manual') {
    return
  }

  if (!ctx.configuration.inboxIds?.length) {
    return
  }

  const { appId, developerApiKey } = _resolveHitlCredentials(ctx)

  if (!appId) {
    throw new RuntimeError('APP_ID is required for HITL in manual mode. Please configure it.')
  }

  await setupHitlChannel({
    ctx,
    client,
    logger,
    appId,
    developerApiKey,
    inboxIds: ctx.configuration.inboxIds,
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  const channelState = await client
    .getState({ type: 'integration', name: 'hitlConfig', id: ctx.integrationId })
    .catch(() => null)

  if (!channelState?.state?.payload?.channelId) {
    return
  }

  const { channelId } = channelState.state.payload
  const hitlClient = getHitlClient(ctx, client, logger)
  const { appId, developerApiKey } = _resolveHitlCredentials(ctx)

  if (!appId) {
    logger.forBot().warn('Cannot archive HITL channel: APP_ID not configured')
    return
  }

  const result = await hitlClient.deleteCustomChannel(channelId, appId, developerApiKey)
  if (result.success) {
    logger.forBot().info(`Archived HITL custom channel ${channelId}`)
  } else {
    logger.forBot().warn(`Could not archive HITL channel ${channelId} — may need manual cleanup`)
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
