import { SharepointClient } from '../SharepointClient'
import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  let state: { payload: { subscriptions: Record<string, { webhookSubscriptionId: string }> } }

  try {
    const result = await client.getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })
    state = result.state as typeof state
  } catch {
    logger.forBot().info('[Unregister] No state found — nothing to clean up')
    return
  }

  for (const [lib, { webhookSubscriptionId }] of Object.entries(state.payload.subscriptions)) {
    try {
      logger.forBot().info(`[Unregister] (${lib}) Deleting webhook ${webhookSubscriptionId}`)
      const spClient = new SharepointClient(ctx.configuration, lib)
      await spClient.unregisterWebhook(webhookSubscriptionId)
      logger.forBot().info(`[Unregister] (${lib}) Unregistered successfully`)
    } catch (error) {
      logger
        .forBot()
        .error(`[Unregister] (${lib}) Failed: ${error instanceof Error ? error.message : String(error)}. Continuing.`)
    }
  }
}
