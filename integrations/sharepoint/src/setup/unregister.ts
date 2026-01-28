import * as bp from '.botpress'
import { SharepointClient } from '../SharepointClient'

export const unregister: bp.IntegrationProps['unregister'] = async ({ client, ctx, logger }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  for (const [lib, { webhookSubscriptionId }] of Object.entries(state.payload.subscriptions as Record<string, any>)) {
    try {
      logger.forBot().info(`[Unregister] (${lib}) Deleting webhook ${webhookSubscriptionId}`)
      const spClient = new SharepointClient({ ...ctx.configuration, folderKbMap: state.payload.folderKbMap }, lib)
      await spClient.unregisterWebhook(webhookSubscriptionId)
      logger.forBot().info(`[Unregister] (${lib}) Successfully unregistered.`)
    } catch (error) {
      logger
        .forBot()
        .error(
          `[Unregister] (${lib}) Failed to unregister: ${error instanceof Error ? error.message : String(error)}. Continuing with other libraries.`
        )
      continue
    }
  }
}
